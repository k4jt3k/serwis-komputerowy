package pl.serwis.komputerowy.web;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import pl.serwis.komputerowy.domain.Zlecenie;
import pl.serwis.komputerowy.service.ZlecenieService;
import pl.serwis.komputerowy.web.dto.*;

@RestController
@RequestMapping("/api/zlecenia")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class ZlecenieController {

  private final ZlecenieService zlecenieService;

  public ZlecenieController(ZlecenieService zlecenieService) {
    this.zlecenieService = zlecenieService;
  }

  // UC3 - Dodanie zlecenia
  @PostMapping
  public ZlecenieResponse create(@Valid @RequestBody ZlecenieCreateRequest req) {
    return map(zlecenieService.create(req));
  }

  @GetMapping("/{id}")
  public ZlecenieResponse get(@PathVariable long id) {
    return map(zlecenieService.get(id));
  }

  // WF.11 filtrowanie zleceń
  @GetMapping
  public List<ZlecenieResponse> list(@RequestParam(required = false) Long statusId,
                                     @RequestParam(required = false) Long pracownikId,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    return zlecenieService.filter(statusId, pracownikId, from, to).stream().map(ZlecenieController::map).toList();
  }

  // UC4 - Przypisanie pracownika
  @PatchMapping("/{id}/pracownik")
  public ZlecenieResponse assign(@PathVariable long id, @Valid @RequestBody AssignPracownikRequest req) {
    return map(zlecenieService.assignPracownik(id, req.pracownikId()));
  }

  // UC5 - Zmiana statusu zlecenia
  @PatchMapping("/{id}/status")
  public ZlecenieResponse changeStatus(@PathVariable long id, @Valid @RequestBody ChangeStatusRequest req) {
    return map(zlecenieService.changeStatus(id, req.statusId()));
  }

  private static ZlecenieResponse map(Zlecenie z) {
    return new ZlecenieResponse(
        z.getId(),
        z.getKlient().getId(),
        z.getUrzadzenie().getId(),
        z.getModelUrzadzenia(),
        z.getAkcesoria(),
        z.getOpisUsterki(),
        z.getData(),
        z.getStatus().getId(),
        z.getPostepNaprawy(),
        z.getPracownik() == null ? null : z.getPracownik().getId()
    );
  }
}
