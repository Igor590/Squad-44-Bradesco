package br.com.squad44.financiamento;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class FinanciamentoController {
  private final FinanciamentoService service;

  private final ContratacaoService contratacao;
  private final PagamentoService pagamentos;

  public FinanciamentoController(FinanciamentoService s, ContratacaoService contratacao, PagamentoService pagamentos) {
    service = s;
    this.contratacao = contratacao;
    this.pagamentos = pagamentos;
  }

  private UUID id(Authentication a) {
    return UUID.fromString(a.getName());
  }

  @GetMapping("/bens")
  public List<Bem> bens(Authentication a) {
    return service.bens(id(a));
  }

  @PostMapping("/bens")
  @ResponseStatus(HttpStatus.CREATED)
  public Bem bem(Authentication a, @Valid @RequestBody ApiDtos.CadastroBem d) {
    return service.cadastrarBem(id(a), d);
  }

  @PostMapping("/simulacoes")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> simular(
      Authentication a, @Valid @RequestBody ApiDtos.PedidoSimulacao d) {
    return service.simular(id(a), d);
  }

  @PostMapping("/propostas")
  public Map<String, Object> solicitar(
      Authentication a, @Valid @RequestBody ApiDtos.PedidoProposta d) {
    return service.solicitar(id(a), d.simulacaoId());
  }

  @GetMapping("/propostas")
  public List<Map<String, Object>> propostas(Authentication a) {
    return service.listar(id(a));
  }

  @GetMapping("/financiamentos")
  public List<ContratacaoService.Contrato> financiamentos(Authentication a) {
    return contratacao.listar(id(a));
  }

  @GetMapping("/financiamentos/{id}")
  public ContratacaoService.Detalhes financiamento(Authentication a, @PathVariable UUID id) {
    return contratacao.detalhar(id(a), id);
  }

  @GetMapping("/pagamentos")
  public List<PagamentoService.Pagamento> historico(Authentication a) {
    return pagamentos.historico(id(a));
  }

  @PostMapping("/financiamentos/{id}/parcelas/{numero}/pagamento")
  public PagamentoService.Pagamento pagar(
      Authentication a, @PathVariable UUID id, @PathVariable int numero,
      @Valid @RequestBody PagamentoService.Pedido pedido) {
    return pagamentos.registrar(id(a), id, numero, pedido);
  }
}
