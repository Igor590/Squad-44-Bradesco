package br.com.squad44.financiamento;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class RegrasFinanceirasTest {
  BigDecimal d(String n) {
    return new BigDecimal(n);
  }

  @Test
  void limites() {
    assertTrue(new ServicoAnalise(18, d("3000.01"), d("1000"), d(".90"), 600).aprovaStatus());
    assertFalse(new ServicoAnalise(17, d("3000.01"), d("1000"), d(".90"), 600).aprovaStatus());
    assertFalse(new ServicoAnalise(18, d("3000"), d("1000"), d(".90"), 600).aprovaStatus());
    assertFalse(new ServicoAnalise(18, d("3000.01"), d("1000"), d(".900001"), 600).aprovaStatus());
    assertFalse(new ServicoAnalise(18, d("3000.01"), d("1000"), d(".90"), 599).aprovaStatus());
  }

  @Test
  void price() {
    var r = new SimuladorFinanciamento().simular(d("12500"), d("2500"), 12, d("1"));
    assertEquals(d("10661.86"), r.totalParcelas());
    assertEquals(d("13161.86"), r.totalPago());
    assertEquals(d("888.47"), r.ultimaParcela());
    assertEquals(d("0.00"), r.parcelas().get(11).saldoDevedor());
  }

  @Test
  void semJuros() {
    var r = new SimuladorFinanciamento().simular(d("1000"), d("100"), 12, d("0"));
    assertEquals(d("75.00"), r.parcelaPadrao());
    assertEquals(d("0.00"), r.totalJuros());
  }

  @Test
  void entradasInvalidas() {
    var s = new SimuladorFinanciamento();
    assertThrows(IllegalArgumentException.class, () -> s.simular(d("1000"), d("1000"), 12, d("1")));
    assertThrows(IllegalArgumentException.class, () -> s.simular(d("1000"), d("0"), 0, d("1")));
    assertThrows(IllegalArgumentException.class, () -> s.simular(d("1000"), d("0"), 12, d("-1")));
  }
}
