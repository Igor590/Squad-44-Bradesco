package br.com.squad44.financiamento;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class BemDetalhesServiceTest {
  private final BemRepository bens = mock(BemRepository.class);
  private final SimulacaoRepository simulacoes = mock(SimulacaoRepository.class);
  private final BemDetalhesService service = new BemDetalhesService(bens, simulacoes);
  private final UUID cliente = UUID.randomUUID();
  private final UUID bemId = UUID.randomUUID();
  private Bem bem;

  @BeforeEach
  void preparar() {
    bem = new Bem();
    bem.id = bemId;
    bem.clienteId = cliente;
    bem.tipoBem = "veiculo";
    bem.descricao = "Carro";
    bem.identificacao = "ABC1D23";
    bem.condicaoBem = "seminovo";
    bem.valorNumerico = new BigDecimal("80000.00");
  }

  @Test
  void consultaBemDoCliente() {
    when(bens.findByIdAndClienteId(bemId, cliente)).thenReturn(Optional.of(bem));
    assertSame(bem, service.consultar(cliente, bemId));
  }

  @Test
  void naoExpoeBemDeOutroCliente() {
    when(bens.findByIdAndClienteId(bemId, cliente)).thenReturn(Optional.empty());
    ResponseStatusException e = assertThrows(ResponseStatusException.class,
        () -> service.consultar(cliente, bemId));
    assertEquals(HttpStatus.NOT_FOUND, e.getStatusCode());
  }

  @Test
  void atualizaSemAlterarTipoProprietarioOuId() {
    when(bens.findByIdAndClienteId(bemId, cliente)).thenReturn(Optional.of(bem));
    Bem atualizado = service.atualizar(cliente, bemId,
        new BemAtualizacaoRequest("  Carro novo  ", " PLACA1 ", "novo", new BigDecimal("85000.00")));
    assertEquals("Carro novo", atualizado.descricao);
    assertEquals("PLACA1", atualizado.identificacao);
    assertEquals("novo", atualizado.condicaoBem);
    assertEquals(0, atualizado.valorNumerico.compareTo(new BigDecimal("85000.00")));
    assertEquals("veiculo", atualizado.tipoBem);
    assertEquals(cliente, atualizado.clienteId);
    assertEquals(bemId, atualizado.id);
  }

  @Test
  void impedeExclusaoQuandoHaSimulacao() {
    when(bens.findByIdAndClienteId(bemId, cliente)).thenReturn(Optional.of(bem));
    when(simulacoes.existsByBemId(bemId)).thenReturn(true);
    ResponseStatusException e = assertThrows(ResponseStatusException.class,
        () -> service.excluir(cliente, bemId));
    assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, e.getStatusCode());
    verify(bens, never()).deleteAndFlush(any(Bem.class));
  }

  @Test
  void excluiBemNaoUtilizado() {
    when(bens.findByIdAndClienteId(bemId, cliente)).thenReturn(Optional.of(bem));
    service.excluir(cliente, bemId);
    verify(bens).deleteAndFlush(bem);
  }
}
