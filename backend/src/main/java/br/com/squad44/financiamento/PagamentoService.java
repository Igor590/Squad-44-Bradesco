package br.com.squad44.financiamento;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PagamentoService {
  private static final String CONSULTA = """
      SELECT g.id AS id_pagamento, f.id AS contrato_id, f.bem_descricao,
        g.numero_parcela, g.valor_original, g.multa, g.juros_mora, g.valor_pago,
        g.data_pagamento, g.forma_pagamento, g.observacao
      FROM pagamentos g JOIN financiamentos f ON f.id = g.financiamento_id
      JOIN propostas p ON p.id = f.proposta_id WHERE p.cliente_id = :cliente
      """;

  private final JdbcClient jdbc;
  private final CalculadoraInadimplencia calculadora = new CalculadoraInadimplencia();

  public PagamentoService(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  static LocalDate hoje() {
    return LocalDate.now(ZoneId.of("America/Recife"));
  }

  @Transactional
  public Pagamento registrar(UUID cliente, UUID financiamento, int numero, Pedido pedido) {
    var contrato = jdbc.sql("""
        SELECT f.id, f.contratado_em, f.bem_descricao FROM financiamentos f
        JOIN propostas p ON p.id = f.proposta_id
        WHERE f.id = :id AND p.cliente_id = :cliente FOR UPDATE
        """).param("id", financiamento).param("cliente", cliente)
        .query(ContratoBloqueado.class).optional()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Financiamento não encontrado."));
    // O bloqueio do financiamento serializa pagamentos e a atualização da quitação.
    var anterior = jdbc.sql(CONSULTA + " AND f.id = :id AND g.numero_parcela = :numero")
        .param("cliente", cliente).param("id", financiamento).param("numero", numero)
        .query(Pagamento.class).optional();
    if (anterior.isPresent()) return anterior.get();
    if (pedido.dataPagamento().isBefore(contrato.contratadoEm())
        || pedido.dataPagamento().isAfter(hoje())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "A data do pagamento deve estar entre a contratação e hoje.");
    }
    var parcela = jdbc.sql("""
        SELECT valor, vencimento FROM parcelas_financiamento
        WHERE financiamento_id = :id AND numero = :numero
        """).param("id", financiamento).param("numero", numero)
        .query(ParcelaOriginal.class).optional()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parcela não encontrada."));
    var encargos = calculadora.calcular(parcela.valor(), parcela.vencimento(), pedido.dataPagamento());
    if (encargos.total().compareTo(pedido.valorPago()) != 0) {
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "O valor mudou. Confira o total da parcela para a data do pagamento.");
    }
    UUID id = UUID.randomUUID();
    jdbc.sql("""
        INSERT INTO pagamentos (id, financiamento_id, numero_parcela, valor_original, multa,
          juros_mora, valor_pago, data_pagamento, registrado_em, forma_pagamento, observacao)
        VALUES (:id, :financiamento, :numero, :original, :multa, :juros, :total, :data, :instante, :forma, :obs)
        """).param("id", id).param("financiamento", financiamento).param("numero", numero)
        .param("original", parcela.valor()).param("multa", encargos.multa())
        .param("juros", encargos.juros()).param("total", encargos.total())
        .param("data", pedido.dataPagamento()).param("instante", OffsetDateTime.now(ZoneOffset.UTC))
        .param("forma", pedido.formaPagamento()).param("obs", pedido.observacao() == null ? "" : pedido.observacao().trim())
        .update();
    jdbc.sql("""
        UPDATE parcelas_financiamento SET status = 'PAGA'
        WHERE financiamento_id = :id AND numero = :numero
        """).param("id", financiamento).param("numero", numero).update();
    jdbc.sql("""
        UPDATE financiamentos SET status = CASE
          WHEN EXISTS (SELECT 1 FROM parcelas_financiamento WHERE financiamento_id = :id AND status <> 'PAGA')
          THEN 'ATIVO' ELSE 'QUITADO' END WHERE id = :id
        """).param("id", financiamento).update();
    return new Pagamento(id, financiamento, contrato.bemDescricao(), numero,
        parcela.valor(), encargos.multa(), encargos.juros(), encargos.total(),
        pedido.dataPagamento(), pedido.formaPagamento(),
        pedido.observacao() == null ? "" : pedido.observacao().trim());
  }

  @Transactional(readOnly = true)
  public List<Pagamento> historico(UUID cliente) {
    return jdbc.sql(CONSULTA + " ORDER BY g.data_pagamento DESC, g.registrado_em DESC, g.id")
        .param("cliente", cliente).query(Pagamento.class).list();
  }

  public record Pedido(
      @NotNull @PastOrPresent LocalDate dataPagamento,
      @NotNull @DecimalMin("0.01") @Digits(integer = 14, fraction = 2) BigDecimal valorPago,
      @NotBlank @Pattern(regexp = "PIX|Débito em Conta Bradesco|Boleto|Transferência")
          String formaPagamento,
      @Size(max = 500) String observacao) {}

  public record Pagamento(
      UUID idPagamento, UUID contratoId, String bemDescricao, int numeroParcela,
      BigDecimal valorOriginal, BigDecimal multa, BigDecimal jurosMora, BigDecimal valorPago,
      LocalDate dataPagamento, String formaPagamento, String observacao) {}

  public record ContratoBloqueado(UUID id, LocalDate contratadoEm, String bemDescricao) {}
  public record ParcelaOriginal(BigDecimal valor, LocalDate vencimento) {}
}
