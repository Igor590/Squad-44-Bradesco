package br.com.squad44.financiamento;

import java.math.BigDecimal;

/** Valores previstos; ainda nao representa uma parcela persistida no banco. */
public record ParcelaSimulada(
    int numero,
    BigDecimal valor,
    BigDecimal juros,
    BigDecimal amortizacao,
    BigDecimal saldoDevedor) {}
