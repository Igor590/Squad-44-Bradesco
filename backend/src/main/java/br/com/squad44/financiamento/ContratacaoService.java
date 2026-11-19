package br.com.squad44.financiamento;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ContratacaoService {
  private static final String CONSULTA = """
      SELECT f.id, f.proposta_id, f.contratado_em, f.cliente_nome, f.bem_descricao, f.status,
             f.cliente_cpf, f.bem_tipo, f.bem_identificacao, f.identificacao_complementada, s.resultado_json
      FROM financiamentos f
      JOIN propostas p ON p.id = f.proposta_id
      JOIN simulacoes s ON s.id = p.simulacao_id
      WHERE p.cliente_id = :cliente
      """;

  private final JdbcTemplate jdbc;
  private final JdbcClient consultas;
  private final ObjectMapper json;

  public ContratacaoService(JdbcTemplate jdbc, JdbcClient consultas, ObjectMapper json) {
    this.jdbc = jdbc;
    this.consultas = consultas;
    this.json = json;
  }

  @Transactional(propagation = Propagation.MANDATORY)
  public void gerar(
      UUID proposta, LocalDate contratadoEm, Cliente cliente, Bem bem,
      ResultadoSimulacao simulacao) {
    UUID id = UUID.randomUUID();
    jdbc.update("""
        INSERT INTO financiamentos (id, proposta_id, contratado_em, cliente_nome, bem_descricao, status,
          cliente_cpf, bem_tipo, bem_identificacao)
        VALUES (?, ?, ?, ?, ?, 'ATIVO', ?, ?, ?)
        """, id, proposta, contratadoEm, cliente.nome, bem.descricao,
        cliente.cpf, bem.tipoBem, bem.identificacao);
    List<Object[]> parcelas = simulacao.parcelas().stream()
        .map(p -> new Object[] {
            id, p.numero(), contratadoEm.plusMonths(p.numero()),
            p.valor(), p.juros(), p.amortizacao()
        })
        .toList();
    jdbc.batchUpdate("""
        INSERT INTO parcelas_financiamento
          (financiamento_id, numero, vencimento, valor, juros, amortizacao, status)
        VALUES (?, ?, ?, ?, ?, ?, 'PENDENTE')
        """, parcelas);
  }

  @Transactional(readOnly = true)
  public List<Contrato> listar(UUID cliente) {
    return consultas.sql(CONSULTA + " ORDER BY f.contratado_em DESC, p.criada_em DESC, f.id")
        .param("cliente", cliente)
        .query(this::lerContrato)
        .list();
  }

  @Transactional(readOnly = true)
  public Detalhes detalhar(UUID cliente, UUID id) {
    Contrato contrato = consultas.sql(CONSULTA + " AND f.id = :id")
        .param("cliente", cliente)
        .param("id", id)
        .query(this::lerContrato)
        .optional()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Financiamento não encontrado."));
    List<Parcela> parcelas = consultas.sql("""
        SELECT q.numero, q.vencimento, q.valor, q.juros, q.amortizacao, q.status,
          g.data_pagamento, g.valor_pago, g.forma_pagamento, g.multa AS multa_paga, g.juros_mora AS mora_paga
        FROM parcelas_financiamento q LEFT JOIN pagamentos g
          ON g.financiamento_id = q.financiamento_id AND g.numero_parcela = q.numero
        WHERE q.financiamento_id = :id ORDER BY q.numero
        """).param("id", id).query((rs, row) -> {
          LocalDate vencimento = rs.getObject("vencimento", LocalDate.class);
          LocalDate pagamento = rs.getObject("data_pagamento", LocalDate.class);
          var encargos = new CalculadoraInadimplencia().calcular(rs.getBigDecimal("valor"),
              vencimento, pagamento == null ? PagamentoService.hoje() : pagamento);
          String status = pagamento != null ? "PAGA" : encargos.diasEmAtraso() > 0 ? "ATRASADA" : "PENDENTE";
          return new Parcela(rs.getInt("numero"), vencimento, rs.getBigDecimal("valor"),
              rs.getBigDecimal("juros"), rs.getBigDecimal("amortizacao"), status,
              encargos.diasEmAtraso(),
              pagamento == null ? encargos.multa() : rs.getBigDecimal("multa_paga"),
              pagamento == null ? encargos.juros() : rs.getBigDecimal("mora_paga"),
              pagamento == null ? encargos.total() : rs.getBigDecimal("valor_pago"),
              pagamento, rs.getBigDecimal("valor_pago"), rs.getString("forma_pagamento"));
        }).list();
    BigDecimal principal = parcelas.stream().filter(p -> !p.status().equals("PAGA"))
        .map(Parcela::amortizacao).reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal emAberto = parcelas.stream().filter(p -> !p.status().equals("PAGA"))
        .map(Parcela::totalAtualizado).reduce(BigDecimal.ZERO, BigDecimal::add);
    return new Detalhes(contrato, parcelas, principal, emAberto);
  }

  private Contrato lerContrato(ResultSet rs, int linha) throws SQLException {
    try {
      var r = json.readValue(rs.getString("resultado_json"), ResultadoSimulacao.class);
      return new Contrato(
          rs.getObject("id", UUID.class),
          rs.getObject("proposta_id", UUID.class),
          rs.getObject("contratado_em", LocalDate.class),
          rs.getString("cliente_nome"),
          rs.getString("bem_descricao"),
          rs.getString("status"),
          rs.getString("cliente_cpf"), rs.getString("bem_tipo"), rs.getString("bem_identificacao"),
          rs.getBoolean("identificacao_complementada"),
          r.valorBem(), r.entrada(), r.valorFinanciado(), r.prazoMeses(), r.taxaMensalPercentual(),
          r.parcelaPadrao(), r.totalParcelas(), r.totalPago());
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Falha ao ler as condições do contrato.", e);
    }
  }

  public record Contrato(
      UUID id, UUID propostaId, LocalDate contratadoEm, String clienteNome, String bemDescricao,
      String status, String clienteCpf, String bemTipo, String bemIdentificacao,
      boolean identificacaoComplementada, BigDecimal valorBem, BigDecimal entrada, BigDecimal valorFinanciado,
      int prazoMeses, BigDecimal taxaMensalPercentual, BigDecimal parcelaPadrao,
      BigDecimal totalParcelas, BigDecimal totalComEntrada) {}

  public record Parcela(
      int numero, LocalDate vencimento, BigDecimal valor, BigDecimal juros,
      BigDecimal amortizacao, String status, long diasEmAtraso, BigDecimal multa,
      BigDecimal jurosMora, BigDecimal totalAtualizado, LocalDate dataPagamento,
      BigDecimal valorTotalPago, String formaPagamento) {}

  public record Detalhes(
      Contrato contrato, List<Parcela> parcelas, BigDecimal saldoPrincipal, BigDecimal totalEmAberto) {}
}
