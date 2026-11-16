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
             s.resultado_json
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
      UUID proposta, LocalDate contratadoEm, String clienteNome, String bemDescricao,
      ResultadoSimulacao simulacao) {
    UUID id = UUID.randomUUID();
    jdbc.update("""
        INSERT INTO financiamentos (id, proposta_id, contratado_em, cliente_nome, bem_descricao, status)
        VALUES (?, ?, ?, ?, ?, 'ATIVO')
        """, id, proposta, contratadoEm, clienteNome, bemDescricao);
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
        SELECT numero, vencimento, valor, juros, amortizacao, status
        FROM parcelas_financiamento
        WHERE financiamento_id = :id
        ORDER BY numero
        """).param("id", id).query(Parcela.class).list();
    return new Detalhes(contrato, parcelas);
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
          r.valorBem(), r.entrada(), r.valorFinanciado(), r.prazoMeses(), r.taxaMensalPercentual(),
          r.parcelaPadrao(), r.totalParcelas(), r.totalPago());
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Falha ao ler as condições do contrato.", e);
    }
  }

  public record Contrato(
      UUID id, UUID propostaId, LocalDate contratadoEm, String clienteNome, String bemDescricao,
      String status, BigDecimal valorBem, BigDecimal entrada, BigDecimal valorFinanciado,
      int prazoMeses, BigDecimal taxaMensalPercentual, BigDecimal parcelaPadrao,
      BigDecimal totalParcelas, BigDecimal totalComEntrada) {}

  public record Parcela(
      int numero, LocalDate vencimento, BigDecimal valor, BigDecimal juros,
      BigDecimal amortizacao, String status) {}

  public record Detalhes(Contrato contrato, List<Parcela> parcelas) {}
}
