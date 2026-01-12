package pl.serwis.komputerowy.web;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import pl.serwis.komputerowy.domain.CzescAudit;
import pl.serwis.komputerowy.domain.CzescZamienna;
import pl.serwis.komputerowy.service.CzescService;
import pl.serwis.komputerowy.web.dto.*;

@RestController
@RequestMapping("/api/czesci")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class CzescController {

  private final CzescService czescService;

  public CzescController(CzescService czescService) {
    this.czescService = czescService;
  }

  // UC6 - rejestracja/aktualizacja części
  @PostMapping
  public CzescResponse upsert(@Valid @RequestBody CzescUpsertRequest req) {
    return map(czescService.upsert(req));
  }

  // WF.11 filtrowanie magazynu
  @GetMapping
  public List<CzescResponse> list(@RequestParam(required = false) String q) {
    return czescService.search(q).stream().map(CzescController::map).toList();
  }

  @GetMapping("/{id}")
  public CzescResponse get(@PathVariable long id) {
    return map(czescService.get(id));
  }

  // Audyt (WNF.03)
  @GetMapping("/{id}/audit")
  public List<CzescAudit> audit(@PathVariable long id) {
    return czescService.audit(id);
  }

  // Zmiana stanu z audytem
  @PatchMapping("/{id}/stan")
  public CzescResponse adjustStock(@PathVariable long id, @Valid @RequestBody AdjustStockRequest req) {
    return map(czescService.adjustStock(id, req));
  }

  private static CzescResponse map(CzescZamienna c) {
    return new CzescResponse(
        c.getId(), c.getNazwa(), c.getNrKatalogowy(), c.getIlosc(), c.getLokalizacja(), c.getCreatedAt(), c.getUpdatedAt()
    );
  }
}
