package br.com.squad44.financiamento;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Regras de acesso, atualização e exclusão de bens pertencentes ao cliente autenticado. */
@Service
public class BemDetalhesService {
  private final BemRepository bens;
  private final SimulacaoRepository simulacoes;

  public BemDetalhesService(BemRepository bens, SimulacaoRepository simulacoes) {
    this.bens = bens;
    this.simulacoes = simulacoes;
  }

  @Transactional(readOnly = true)
  public Bem consultar(UUID clienteId, UUID bemId) {
    return doCliente(clienteId, bemId);
  }

  @Transactional
  public Bem atualizar(UUID clienteId, UUID bemId, BemAtualizacaoRequest request) {
    Bem bem = doCliente(clienteId, bemId);
    // Não alteramos o tipo ou proprietário, e preservamos o UUID usado pelas simulações.
    bem.descricao = request.descricao().trim();
    bem.identificacao = request.identificacao() == null ? "" : request.identificacao().trim();
    bem.condicaoBem = request.condicaoBem();
    bem.valorNumerico = request.valorNumerico();
    return bem;
  }

  @Transactional
  public void excluir(UUID clienteId, UUID bemId) {
    Bem bem = doCliente(clienteId, bemId);
    if (simulacoes.existsByBemId(bemId)) {
      throw new ResponseStatusException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "O bem está vinculado a uma simulação e não pode ser excluído.");
    }
    // A FK do banco continua protegendo contra uma simulação criada concorrentemente.
    bens.deleteAndFlush(bem);
  }

  private Bem doCliente(UUID clienteId, UUID bemId) {
    return bens.findByIdAndClienteId(bemId, clienteId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND, "Bem não encontrado para este cliente."));
  }
}
