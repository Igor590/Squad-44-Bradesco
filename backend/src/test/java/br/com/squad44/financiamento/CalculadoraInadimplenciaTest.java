package br.com.squad44.financiamento;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class CalculadoraInadimplenciaTest {
  private final CalculadoraInadimplencia calculadora = new CalculadoraInadimplencia();
  private final LocalDate vencimento = LocalDate.of(2026, 11, 10);

  @Test
  void calculaEncargosConformeOsDiasDeAtraso() {
    conferir("1000", vencimento.minusDays(1), 0, "0.00", "0.00", "1000.00");
    conferir("1000", vencimento, 0, "0.00", "0.00", "1000.00");
    conferir("1000", vencimento.plusDays(1), 1, "0.00", "0.33", "1000.33");
    conferir("1000", vencimento.plusDays(2), 2, "20.00", "0.66", "1020.66");
    conferir("1000", vencimento.plusDays(5), 5, "20.00", "1.65", "1021.65");
  }

  @Test
  void arredondaOsJurosDepoisDeAcumularTodosOsDias() {
    conferir("10.99", vencimento.plusDays(3), 3, "0.22", "0.01", "11.22");
  }

  @Test
  void rejeitaValorInvalido() {
    for (String valor : new String[] {"0", "-1.00", "100.001"}) {
      assertThrows(IllegalArgumentException.class,
          () -> calculadora.calcular(new BigDecimal(valor), vencimento, vencimento));
    }
  }

  private void conferir(
      String valor, LocalDate dataReferencia, long dias, String multa, String juros, String total) {
    var resultado = calculadora.calcular(new BigDecimal(valor), vencimento, dataReferencia);
    assertEquals(new CalculadoraInadimplencia.Resultado(
        dias, new BigDecimal(multa), new BigDecimal(juros), new BigDecimal(total)), resultado);
  }
}
