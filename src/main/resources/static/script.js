const API_URL = "/api";

window.pokazSekcje = function(nazwa) {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(p => p.classList.remove('active'));
    document.getElementById('sekcja-' + nazwa).classList.add('active');
    
    if (nazwa === 'klienci') pobierzKlientow();
    if (nazwa === 'zlecenia') pobierzZlecenia();
    if (nazwa === 'czesci') pobierzCzesci();
    if (nazwa === 'zamowienia') pobierzZamowienia();
    if (nazwa === 'raporty') pobierzRaporty();
};

async function fetchSafe(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) { return []; }
}

async function pobierzKlientow() {
    const dane = await fetchSafe(`${API_URL}/klienci`);
    document.getElementById('tabela-klientow-body').innerHTML = dane.map(k => `
        <tr><td>${k.id}</td><td>${k.imie}</td><td>${k.nazwisko}</td><td>${k.nrTelefonu || '-'}</td><td>${k.adres || '-'}</td></tr>
    `).join('');
}

async function pobierzZlecenia() {
    const [resK, resZ, resP, resS, resU] = await Promise.all([
        fetchSafe(`${API_URL}/klienci`),
        fetchSafe(`${API_URL}/zlecenia`),
        fetchSafe(`${API_URL}/pracownicy`),
        fetchSafe(`${API_URL}/statusy`),
        fetchSafe(`${API_URL}/urzadzenia`)
    ]);

    document.getElementById('tabela-zlecenia-body').innerHTML = resZ.map(z => {
        const k = resK.find(i => i.id === z.klient);
        const p = resP.find(i => i.id === z.pracownik);
        const s = resS.find(i => i.id === z.status);
        const u = resU.find(i => i.id === z.urzadzenie);

        return `<tr>
            <td>${z.id}</td>
            <td>${k ? k.imie + ' ' + k.nazwisko : 'Klient #' + z.klient}</td>
            <td>${u ? u.urzadzenie : 'Urządzenie #' + z.urzadzenie}</td>
            <td>${z.modelUrzadzenia}</td>
            <td>${z.opisUsterki}</td>
            <td>${z.data ? new Date(z.data).toLocaleDateString() : '-'}</td>
            <td><span class="badge badge-status">${s ? s.status : 'Status #' + z.status}</span></td>
            <td>${z.postepNaprawy || '0%'}</td>
            <td>${p ? p.imie : 'Brak'}</td>
            <td><button class="btn btn-sm btn-yellow" onclick="otworzEdycjeStatusu(${z.id})">EDYTUJ</button></td>
        </tr>`;
    }).join('');
}

async function pobierzCzesci() {
    const res = await fetchSafe(`${API_URL}/czesci`);
    document.getElementById('tabela-czesci-body').innerHTML = res.map(c => `
        <tr><td>${c.id}</td><td>${c.nazwa}</td><td>${c.nrKatalogowy}</td>
        <td>
            <button class="btn btn-sm btn-outline-danger py-0" onclick="zmienStan(${c.id},-1)">-</button>
            <span class="mx-2">${c.ilosc}</span>
            <button class="btn btn-sm btn-outline-success py-0" onclick="zmienStan(${c.id},1)">+</button>
        </td>
        <td>${c.lokalizacja || '-'}</td></tr>
    `).join('');
}

async function pobierzZamowienia() {
    const [resZ, resZam, resDoZ] = await Promise.all([
        fetchSafe(`${API_URL}/zlecenia`),
        fetchSafe(`${API_URL}/zamowienia`),
        fetchSafe(`${API_URL}/do-zamowienia`)
    ]);
    document.getElementById('tabela-zamowienia-body').innerHTML = resZam.map(zam => {
        const zlec = resZ.find(i => i.id === zam.zlecenie);
        const przed = resDoZ.find(i => i.id === zam.zamowionyPrzedmiot);
        return `<tr>
            <td>${zam.id}</td>
            <td>#${zam.zlecenie} ${zlec ? zlec.modelUrzadzenia : ''}</td>
            <td>${przed ? przed.zamowionyPrzedmiot : 'ID: ' + zam.zamowionyPrzedmiot}</td>
            <td>${zam.cena} PLN</td>
            <td>${zam.odebrane ? 'TAK' : 'NIE'}</td>
            <td>${!zam.odebrane ? `<button class="btn btn-sm btn-yellow" onclick="odbierzZamowienie(${zam.id})">ODBIERZ</button>` : '-'}</td>
        </tr>`;
    }).join('');
}

async function pobierzRaporty() {
    const [r1, r2, r3] = await Promise.all([
        fetchSafe(`${API_URL}/raporty/1`),
        fetchSafe(`${API_URL}/raporty/2`),
        fetchSafe(`${API_URL}/raporty/3`)
    ]);
    document.getElementById('raport-1-content').innerText = Array.isArray(r1) ? r1.length : 0;
    document.getElementById('raport-2-content').innerText = Array.isArray(r2) ? r2.length : 0;
    document.getElementById('raport-3-content').innerText = (r3 && r3.length > 0) ? r3[0].modelUrzadzenia : "-";
}

function eksportujRaport() { window.location.href = `${API_URL}/raporty/1/export`; }

async function otworzEdycjeStatusu(id) {
    const statusy = await fetchSafe(`${API_URL}/statusy`);
    document.getElementById('edit-zlec-id').value = id;
    document.getElementById('edit-zlec-status').innerHTML = statusy.map(s => `<option value="${s.id}">${s.status}</option>`).join('');
    new bootstrap.Modal(document.getElementById('modalStatus')).show();
}

async function zmienStan(id, delta) {
    await fetch(`${API_URL}/czesci/${id}/stan`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ zmiana: parseInt(delta), powod: "KOREKTA" })
    });
    pobierzCzesci();
}

async function odbierzZamowienie(id) {
    await fetch(`${API_URL}/zamowienia/${id}/odebrane?value=true`, { method: 'PATCH' });
    pobierzZamowienia();
}

window.otworzModalZlecenia = async () => {
    const [k, p, u] = await Promise.all([fetchSafe(`${API_URL}/klienci`), fetchSafe(`${API_URL}/pracownicy`), fetchSafe(`${API_URL}/urzadzenia`)]);
    document.getElementById('f-zlec-klient').innerHTML = k.map(i => `<option value="${i.id}">${i.imie} ${i.nazwisko}</option>`).join('');
    document.getElementById('f-zlec-pracownik').innerHTML = '<option value="">Przypisz Pracownika</option>' + p.map(i => `<option value="${i.id}">${i.imie}</option>`).join('');
    document.getElementById('f-zlec-urzadzenie').innerHTML = u.map(i => `<option value="${i.id}">${i.urzadzenie}</option>`).join('');
    new bootstrap.Modal(document.getElementById('modalZlecenie')).show();
};

window.otworzModalZamowienia = async () => {
    const [z, dz] = await Promise.all([fetchSafe(`${API_URL}/zlecenia`), fetchSafe(`${API_URL}/do-zamowienia`)]);
    document.getElementById('f-zam-zlec').innerHTML = z.map(i => `<option value="${i.id}">#${i.id} ${i.modelUrzadzenia}</option>`).join('');
    document.getElementById('f-zam-przedmiot').innerHTML = dz.map(i => `<option value="${i.id}">${i.zamowionyPrzedmiot}</option>`).join('');
    new bootstrap.Modal(document.getElementById('modalZamowienie')).show();
};

window.otworzModal = (id) => new bootstrap.Modal(document.getElementById(id)).show();

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('formKlient').onsubmit = async (e) => {
        e.preventDefault();
        const data = { 
            imie: document.getElementById('f-imie').value, 
            nazwisko: document.getElementById('f-nazwisko').value, 
            nrTelefonu: document.getElementById('f-telefon').value, 
            adres: document.getElementById('f-adres').value 
        };
        await fetch(`${API_URL}/klienci`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        location.reload();
    };

    document.getElementById('formZlecenie').onsubmit = async (e) => {
        e.preventDefault();
        const data = { 
            klient: parseInt(document.getElementById('f-zlec-klient').value), 
            urzadzenie: parseInt(document.getElementById('f-zlec-urzadzenie').value),
            modelUrzadzenia: document.getElementById('f-zlec-model').value, 
            opisUsterki: document.getElementById('f-zlec-opis').value,
            pracownik: parseInt(document.getElementById('f-zlec-pracownik').value) || null
        };
        await fetch(`${API_URL}/zlecenia`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        location.reload();
    };

    document.getElementById('formStatus').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-zlec-id').value;
        const data = { 
            status: parseInt(document.getElementById('edit-zlec-status').value), 
            postepNaprawy: document.getElementById('edit-zlec-postep').value 
        };
        await fetch(`${API_URL}/zlecenia/${id}/status`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        location.reload();
    };

    document.getElementById('formCzesc').onsubmit = async (e) => {
        e.preventDefault();
        const data = { 
            nazwa: document.getElementById('c-nazwa').value, 
            nrKatalogowy: document.getElementById('c-nr').value, 
            ilosc: parseInt(document.getElementById('c-ilosc').value), 
            lokalizacja: document.getElementById('c-lokalizacja').value 
        };
        await fetch(`${API_URL}/czesci`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        location.reload();
    };

    document.getElementById('formZamowienie').onsubmit = async (e) => {
        e.preventDefault();
        const data = { 
            zlecenie: parseInt(document.getElementById('f-zam-zlec').value), 
            zamowionyPrzedmiot: parseInt(document.getElementById('f-zam-przedmiot').value), 
            cena: parseFloat(document.getElementById('f-zam-cena').value) 
        };
        await fetch(`${API_URL}/zamowienia`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        location.reload();
    };
});