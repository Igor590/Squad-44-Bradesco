package br.com.squad44.financiamento;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

public final class CalculadoraInadimplencia {
  private static final BigDecimal MULTA = new BigDecimal("0.02");
  private static final BigDecimal MORA_DIARIA = new BigDecimal("0.00033");

  /** Use a data da consulta para uma parcela em aberto ou a do pagamento para uma parcela paga. */
  public Resultado calcular(
      BigDecimal valorOriginal, LocalDate vencimento, LocalDate dataReferencia) {
    Objects.requireNonNull(valorOriginal, "Informe o valor original da parcela.");
    Objects.requireNonNull(vencimento, "Informe a data de vencimento.");
    Objects.requireNonNull(dataReferencia, "Informe a data de referência.");
    if (valorOriginal.signum() <= 0 || valorOriginal.stripTrailingZeros().scale() > 2) {
      throw new IllegalArgumentException("O valor da parcela deve ser positivo e em centavos.");
    }

    long diasEmAtraso = Math.max(0, ChronoUnit.DAYS.between(vencimento, dataReferencia));
    BigDecimal multa = centavos(
        diasEmAtraso > 1 ? valorOriginal.multiply(MULTA) : BigDecimal.ZERO);
    BigDecimal juros = centavos(
        valorOriginal.multiply(MORA_DIARIA).multiply(BigDecimal.valueOf(diasEmAtraso)));
    BigDecimal total = valorOriginal.setScale(2).add(multa).add(juros);
    return new Resultado(diasEmAtraso, multa, juros, total);
  }

  private static BigDecimal centavos(BigDecimal valor) {
    return valor.setScale(2, RoundingMode.HALF_UP);
  }

  public record Resultado(long diasEmAtraso, BigDecimal multa, BigDecimal juros, BigDecimal total) {}
}
