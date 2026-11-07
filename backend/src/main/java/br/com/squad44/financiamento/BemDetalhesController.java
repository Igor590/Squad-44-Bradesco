package br.com.squad44.financiamento;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Operações adicionais de Bens sem alterar o contrato já usado pelo frontend. */
@RestController
@RequestMapping("/api/bens/{id}")
public class BemDetalhesController {
  private final BemDetalhesService service;

  public BemDetalhesController(BemDetalhesService service) {
    this.service = service;
  }

  @GetMapping
  public Bem consultar(Authentication auth, @PathVariable UUID id) {
    return service.consultar(UUID.fromString(auth.getName()), id);
  }

  @PutMapping
  public Bem atualizar(
      Authentication auth, @PathVariable UUID id, @Valid @RequestBody BemAtualizacaoRequest request) {
    return service.atualizar(UUID.fromString(auth.getName()), id, request);
  }

  @DeleteMapping
  public ResponseEntity<Void> excluir(Authentication auth, @PathVariable UUID id) {
    service.excluir(UUID.fromString(auth.getName()), id);
    return ResponseEntity.noContent().build();
  }
}
