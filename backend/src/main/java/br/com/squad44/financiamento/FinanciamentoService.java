package br.com.squad44.financiamento;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FinanciamentoService {
  private final ClienteRepository clientes;
  private final BemRepository bens;
  private final SimulacaoRepository simulacoes;
  private final PropostaRepository propostas;
  private final ObjectMapper json;

  public FinanciamentoService(
      ClienteRepository c,
      BemRepository b,
      SimulacaoRepository s,
      PropostaRepository p,
      ObjectMapper j) {
    clientes = c;
    bens = b;
    simulacoes = s;
    propostas = p;
    json = j;
  }

  public List<Bem> bens(UUID cliente) {
    return bens.findByClienteId(cliente);
  }

  @Transactional
  public Bem cadastrarBem(UUID cliente, ApiDtos.CadastroBem d) {
    Bem b = new Bem();
    b.id = UUID.randomUUID();
    b.clienteId = cliente;
    b.tipoBem = d.tipoBem();
    b.descricao = d.descricao().trim();
    b.identificacao = d.identificacao() == null ? "" : d.identificacao().trim();
    b.condicaoBem = d.condicaoBem();
    b.valorNumerico = d.valorNumerico();
    return bens.save(b);
  }

  @Transactional
  public Map<String, Object> simular(UUID cliente, ApiDtos.PedidoSimulacao d) {
    Bem b = bens.findByIdAndClienteId(d.bemId(), cliente).orElseThrow(() -> missing());
    var resultado =
        new SimuladorFinanciamento()
            .simular(b.valorNumerico, d.entrada(), d.prazoMeses(), d.taxaMensalPercentual());
    Simulacao s = new Simulacao();
    s.id = UUID.randomUUID();
    s.clienteId = cliente;
    s.bemId = b.id;
    s.criadaEm = Instant.now();
    s.resultadoJson = encode(resultado);
    simulacoes.save(s);
    return Map.of("id", s.id, "resultado", resultado);
  }

  @Transactional
  public Map<String, Object> solicitar(UUID cliente, UUID simulacaoId) {
    Simulacao s =
        simulacoes.findByIdAndClienteId(simulacaoId, cliente).orElseThrow(() -> missing());
    var anterior = propostas.findBySimulacaoId(simulacaoId);
    if (anterior.isPresent()) return view(anterior.get());
    Cliente c = clientes.findById(cliente).orElseThrow(() -> missing());
    ResultadoSimulacao r = decode(s.resultadoJson, ResultadoSimulacao.class);
    int idade =
        Period.between(c.nascimento, LocalDate.now(ZoneId.of("America/Sao_Paulo"))).getYears();
    var analise =
        new ServicoAnalise(idade, c.renda, r.maiorParcela(), r.percentualFinanciado(), c.score);
    Proposta p = new Proposta();
    p.id = UUID.randomUUID();
    p.clienteId = cliente;
    p.simulacaoId = s.id;
    p.criadaEm = Instant.now();
    p.status = "EM_ANALISE";
    p.motivosJson = "[]";
    p.idadeAnalisada = idade;
    p.rendaAnalisada = c.renda;
    p.scoreAnalisado = c.score;
    propostas.saveAndFlush(p);
    p.status = analise.aprovaStatus() ? "APROVADO" : "REPROVADO";
    p.motivosJson = encode(analise.getMotivosReprovacao());
    propostas.save(p);
    return view(p);
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> listar(UUID cliente) {
    return propostas.findByClienteIdOrderByCriadaEmDesc(cliente).stream().map(this::view).toList();
  }

  private Map<String, Object> view(Proposta p) {
    Simulacao s = simulacoes.findById(p.simulacaoId).orElseThrow();
    Bem b = bens.findById(s.bemId).orElseThrow();
    return Map.of(
        "idProposta",
        p.id,
        "dataSolicitacao",
        p.criadaEm,
        "bemDescricao",
        b.descricao,
        "status",
        p.status,
        "motivosReprovacao",
        decode(p.motivosJson, List.class),
        "resultado",
        decode(s.resultadoJson, ResultadoSimulacao.class),
        "scoreDemonstrativo",
        true);
  }

  private String encode(Object value) {
    try {
      return json.writeValueAsString(value);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Falha ao salvar resultado", e);
    }
  }

  private <T> T decode(String value, Class<T> type) {
    try {
      return json.readValue(value, type);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Falha ao ler resultado", e);
    }
  }

  private static ResponseStatusException missing() {
    return new ResponseStatusException(
        HttpStatus.NOT_FOUND, "Registro não encontrado para este cliente.");
  }
}
