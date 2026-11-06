package br.com.squad44.financiamento;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Price com capitalizacao mensal; primeira parcela apos um mes, sem carencia. Taxa de entrada em
 * porcentagem: 1.5 representa 1,5% ao mes. Valores em reais; juros e amortizacoes de cada parcela
 * em centavos.
 */
public final class SimuladorFinanciamento {
  private static final MathContext PRECISAO = MathContext.DECIMAL128;
  private static final BigDecimal ZERO = new BigDecimal("0.00");
  public static final BigDecimal VALOR_MAXIMO = new BigDecimal("999999999999.99");
  public static final int PRAZO_MAXIMO = 600;

  public ResultadoSimulacao simular(
      BigDecimal valorBem, BigDecimal entrada, int prazoMeses, BigDecimal taxaMensalPercentual) {
    valorBem = validarDinheiro(valorBem, "Valor do bem");
    entrada = validarDinheiro(entrada, "Entrada");
    if (valorBem.signum() <= 0)
      throw new IllegalArgumentException("Valor do bem deve ser positivo.");
    if (entrada.compareTo(valorBem) >= 0) {
      throw new IllegalArgumentException(
          "Entrada deve ser menor que o bem. Entrada integral nao gera financiamento.");
    }
    if (prazoMeses < 1 || prazoMeses > PRAZO_MAXIMO) {
      throw new IllegalArgumentException("Prazo deve estar entre 1 e 600 meses.");
    }
    if (taxaMensalPercentual == null
        || taxaMensalPercentual.signum() < 0
        || taxaMensalPercentual.compareTo(new BigDecimal("100")) > 0
        || Math.max(0, taxaMensalPercentual.stripTrailingZeros().scale()) > 6) {
      throw new IllegalArgumentException(
          "Taxa mensal deve estar entre 0 e 100%, com ate seis casas decimais.");
    }
    BigDecimal principal = valorBem.subtract(entrada);
    BigDecimal taxa = taxaMensalPercentual.movePointLeft(2);
    BigDecimal prestacao;
    if (taxa.signum() == 0) {
      prestacao = principal.divide(BigDecimal.valueOf(prazoMeses), PRECISAO);
    } else {
      // P = V * i / (1 - (1+i)^(-n)), sem double ou float.
      BigDecimal fator = BigDecimal.ONE.add(taxa).pow(prazoMeses, PRECISAO);
      prestacao =
          principal
              .multiply(taxa, PRECISAO)
              .multiply(fator, PRECISAO)
              .divide(fator.subtract(BigDecimal.ONE), PRECISAO);
    }
    BigDecimal padrao = centavos(prestacao);
    BigDecimal saldo = principal;
    BigDecimal soma = ZERO;
    BigDecimal jurosTotais = ZERO;
    List<ParcelaSimulada> parcelas = new ArrayList<>();
    for (int numero = 1; numero <= prazoMeses; numero++) {
      BigDecimal juros = centavos(saldo.multiply(taxa));
      // A ultima parcela quita exatamente o saldo restante e seus juros.
      BigDecimal valor = numero == prazoMeses ? saldo.add(juros) : padrao;
      BigDecimal amortizacao = valor.subtract(juros);
      if (amortizacao.signum() <= 0
          || amortizacao.compareTo(saldo) > 0
          || (numero < prazoMeses && amortizacao.compareTo(saldo) == 0)) {
        throw new IllegalArgumentException(
            "Valor, taxa e prazo nao permitem este cronograma Price em centavos. Reduza o prazo ou"
                + " revise os valores.");
      }
      saldo = saldo.subtract(amortizacao);
      parcelas.add(new ParcelaSimulada(numero, valor, juros, amortizacao, saldo));
      soma = soma.add(valor);
      jurosTotais = jurosTotais.add(juros);
    }
    BigDecimal percentual = principal.divide(valorBem, PRECISAO);
    return new ResultadoSimulacao(
        valorBem,
        entrada,
        principal,
        prazoMeses,
        taxaMensalPercentual,
        percentual,
        padrao,
        soma,
        jurosTotais,
        entrada.add(soma),
        parcelas);
  }

  private static BigDecimal centavos(BigDecimal valor) {
    return valor.setScale(2, RoundingMode.HALF_UP);
  }

  private static BigDecimal validarDinheiro(BigDecimal valor, String nome) {
    if (valor == null || valor.signum() < 0 || valor.compareTo(VALOR_MAXIMO) > 0) {
      throw new IllegalArgumentException(nome + " deve estar entre 0 e " + VALOR_MAXIMO + ".");
    }
    try {
      return valor.setScale(2, RoundingMode.UNNECESSARY);
    } catch (ArithmeticException e) {
      throw new IllegalArgumentException(nome + " deve ter no maximo duas casas decimais.");
    }
  }
}
