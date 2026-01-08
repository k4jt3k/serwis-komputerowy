const API_URL = "http://localhost:8080/api";

// --- NAWIGACJA (GLOBALNA) ---
window.pokazSekcje = function(nazwa) {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(p => p.classList.remove('active'));
    
    const sekcja = document.getElementById('sekcja-' + nazwa);
    if (sekcja) sekcja.classList.add('active');
    
    if (event && event.currentTarget) event.currentTarget.classList.add('active');

    // Przeładowanie danych
    if (nazwa === 'klienci') pobierzKlientow();
    else if (nazwa === 'zlecenia') pobierzZlecenia();
    else if (nazwa === 'czesci') pobierzCzesci();
    else if (nazwa === 'zamowienia') pobierzZamowienia();
    else if (nazwa === 'raporty') pobierzRaporty();
};

// --- POBIERANIE DANYCH (GET) ---
async function pobierzKlientow() {
    try {
        const res = await fetch(`${API_URL}/klienci`);
        const dane = await res.json();
        dane.sort((a,b) => a.id - b.id);
        document.getElementById('tabela-klientow-body').innerHTML = dane.map(k => `
            <tr><td><span class="text-muted">#${k.id}</span></td><td>${k.imie} ${k.nazwisko}</td><td>${k.nrTelefonu || '-'}</td><td>${k.adres || '-'}</td></tr>
        `).join('');
    } catch (e) { console.error("Błąd ładowania klientów:", e); }
}

async function pobierzZlecenia() {
    try {
        const [resK, resZ] = await Promise.all([
            fetch(`${API_URL}/klienci`).then(r => r.json()),
            fetch(`${API_URL}/zlecenia`).then(r => r.json())
        ]);
        document.getElementById('tabela-zlecenia-body').innerHTML = resZ.map(z => {
            const k = resK.find(item => item.id === z.klientId);
            return `<tr><td>${z.id}</td><td>${k ? k.imie+' '+k.nazwisko : 'ID:'+z.klientId}</td><td><strong>${z.modelUrzadzenia}</strong><br><small class="text-muted">SN: ${z.numerSeryjny || '-'}</small></td><td>${z.opisUsterki}</td><td><span class="badge badge-status">${z.status || 'NOWE'}</span></td><td><button class="btn btn-sm btn-outline-yellow" onclick="otworzEdycjeZlecenia(${z.id})">AKTUALIZUJ</button></td></tr>`;
        }).join('');
    } catch (e) { console.error("Błąd ładowania zleceń:", e); }
}

async function pobierzCzesci() {
    try {
        const res = await fetch(`${API_URL}/czesci`).then(r => r.json());
        document.getElementById('tabela-czesci-body').innerHTML = res.map(c => `
            <tr><td>${c.id}</td><td><strong>${c.nazwa}</strong></td><td><code class="text-warning">${c.nrKatalogowy}</code></td><td><button class="btn btn-sm btn-outline-danger py-0" onclick="zmienStanCzesci(${c.id},-1)">-</button><span class="mx-3 fw-bold">${c.ilosc}</span><button class="btn btn-sm btn-outline-success py-0" onclick="zmienStanCzesci(${c.id},1)">+</button></td></tr>
        `).join('');
    } catch (e) { console.error(e); }
}

async function pobierzZamowienia() {
    try {
        const [resZlec, resZam] = await Promise.all([
            fetch(`${API_URL}/zlecenia`).then(r => r.json()),
            fetch(`${API_URL}/zamowienia`).then(r => r.json())
        ]);
        document.getElementById('tabela-zamowienia-body').innerHTML = resZam.map(zam => {
            const zlec = resZlec.find(z => z.id === zam.zlecenieId);
            return `<tr><td>${zam.id}</td><td>${zlec ? zlec.modelUrzadzenia : 'Zlecenie #'+zam.zlecenieId}</td><td>${zam.cena} PLN</td><td>${zam.odebrane ? '✅ ODEBRANE' : '⏳ W DRODZE'}</td><td>${!zam.odebrane ? `<button class="btn btn-sm btn-yellow" onclick="odbierzZamowienie(${zam.id})">ODBIERZ</button>` : '-'}</td></tr>`;
        }).join('');
    } catch (e) { console.error(e); }
}

async function pobierzRaporty() {
    const safeFetch = (url) => fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);
    const [r1, r2, r3] = await Promise.all([safeFetch(`${API_URL}/raporty/1`), safeFetch(`${API_URL}/raporty/2`), safeFetch(`${API_URL}/raporty/3`)]);
    
    document.getElementById('raport-1-content').innerText = r1 ? r1.length : "0";
    document.getElementById('raport-2-content').innerText = r2 ? r2.length : "0";
    if(r3) {
        document.getElementById('raport-3-content').innerHTML = r3.length > 0 ? r3[0].modelUrzadzenia : "BRAK DANYCH";
    } else {
        document.getElementById('raport-3-content').innerText = "SERWER ERROR 500";
    }
}

// --- AKCJE (PATCH) ---
async function zmienStanCzesci(id, delta) {
    await fetch(`${API_URL}/czesci/${id}/stan`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ zmiana: parseInt(delta), powod: "AUDIT" }) });
    pobierzCzesci();
}

async function odbierzZamowienie(id) {
    await fetch(`${API_URL}/zamowienia/${id}/odebrane?value=true`, { method: 'PATCH' });
    pobierzZamowienia();
}

// --- MODALE (OPEN/CLOSE) ---
window.otworzModal = (id) => {
    const el = document.getElementById(id);
    if(el) bootstrap.Modal.getOrCreateInstance(el).show();
};

window.zamknijModal = (id) => {
    const el = document.getElementById(id);
    if(el) bootstrap.Modal.getInstance(el).hide();
};

window.otworzEdycjeZlecenia = (id) => {
    document.getElementById('edit-zlec-id').value = id;
    window.otworzModal('modalEdytujZlecenie');
};

window.otworzModalZlecenia = () => {
    fetch(`${API_URL}/klienci`).then(r => r.json()).then(d => {
        document.getElementById('f-zlec-klient').innerHTML = d.map(k => `<option value="${k.id}">${k.imie} ${k.nazwisko}</option>`).join('');
        window.otworzModal('modalZlecenie');
    });
};

window.otworzModalZamowienia = () => {
    fetch(`${API_URL}/zlecenia`).then(r => r.json()).then(d => {
        document.getElementById('f-zam-zlecenie').innerHTML = d.map(z => `<option value="${z.id}">${z.modelUrzadzenia} (#${z.id})</option>`).join('');
        window.otworzModal('modalZamowienie');
    });
};

// --- FORMULARZE ONLOAD ---
window.onload = () => {
    pobierzKlientow();

    const setupForm = (id, url) => {
        const form = document.getElementById(id);
        if(!form) return;
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {};
            
            // Mapowanie danych (Zgodnie z dokumentacją Etap 2)
            if(id === 'formKlient') {
                data.imie = document.getElementById('f-imie').value;
                data.nazwisko = document.getElementById('f-nazwisko').value;
                data.nrTelefonu = document.getElementById('f-telefon').value;
                data.adres = document.getElementById('f-adres').value;
            } else if(id === 'formZlecenie') {
                data.klientId = parseInt(document.getElementById('f-zlec-klient').value);
                data.modelUrzadzenia = document.getElementById('f-zlec-model').value;
                data.numerSeryjny = document.getElementById('f-zlec-sn').value;
                data.opisUsterki = document.getElementById('f-zlec-opis').value;
            } else if(id === 'formCzesc') {
                data.nazwa = document.getElementById('c-nazwa').value;
                data.nrKatalogowy = document.getElementById('c-nr').value;
                data.ilosc = parseInt(document.getElementById('c-ilosc').value);
                data.lokalizacja = document.getElementById('c-lokalizacja').value;
            } else if(id === 'formZamowienie') {
                data.zlecenieId = parseInt(document.getElementById('f-zam-zlecenie').value);
                data.doZamowieniaId = data.zlecenieId;
                data.cena = parseFloat(document.getElementById('f-zam-cena').value);
            } else if(id === 'formEdytujZlecenie') {
                const idZlec = document.getElementById('edit-zlec-id').value;
                const statusId = parseInt(document.getElementById('edit-zlec-statusId').value);
                await fetch(`${API_URL}/zlecenia/${idZlec}/status`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ statusId: statusId }) });
                window.zamknijModal('modalEdytujZlecenie');
                pobierzZlecenia();
                return;
            }

            const res = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            if(res.ok) {
                const modalId = id.replace('form', 'modal');
                window.zamknijModal(modalId);
                window.onload(); // Odśwież widok
                form.reset();
            }
        };
    };

    setupForm('formKlient', `${API_URL}/klienci`);
    setupForm('formZlecenie', `${API_URL}/zlecenia`);
    setupForm('formCzesc', `${API_URL}/czesci`);
    setupForm('formZamowienie', `${API_URL}/zamowienia`);
    setupForm('formEdytujZlecenie', ''); // Specjalna obsługa wewnątrz
};