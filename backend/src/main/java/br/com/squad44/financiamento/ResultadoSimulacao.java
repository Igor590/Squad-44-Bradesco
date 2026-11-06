package br.com.squad44.financiamento;

import java.math.BigDecimal;
import java.util.List;

/** Resultado independente de terminal, pronto para consumo por outras camadas. */
public record ResultadoSimulacao(
    BigDecimal valorBem,
    BigDecimal entrada,
    BigDecimal valorFinanciado,
    int prazoMeses,
    BigDecimal taxaMensalPercentual,
    BigDecimal percentualFinanciado,
    BigDecimal parcelaPadrao,
    BigDecimal totalParcelas,
    BigDecimal totalJuros,
    BigDecimal totalPago,
    List<ParcelaSimulada> parcelas) {
  public ResultadoSimulacao {
    parcelas = List.copyOf(parcelas);
  }

  public BigDecimal maiorParcela() {
    return parcelas.stream().map(ParcelaSimulada::valor).max(BigDecimal::compareTo).orElseThrow();
  }

  public BigDecimal ultimaParcela() {
    return parcelas.get(parcelas.size() - 1).valor();
  }
}
