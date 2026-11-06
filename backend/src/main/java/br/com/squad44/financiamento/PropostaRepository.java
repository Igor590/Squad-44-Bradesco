package br.com.squad44.financiamento;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PropostaRepository extends JpaRepository<Proposta, java.util.UUID> {
  java.util.List<Proposta> findByClienteIdOrderByCriadaEmDesc(java.util.UUID clienteId);

  java.util.Optional<Proposta> findBySimulacaoId(java.util.UUID simulacaoId);
}
