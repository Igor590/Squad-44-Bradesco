package br.com.squad44.financiamento;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SimulacaoRepository extends JpaRepository<Simulacao, java.util.UUID> {
  java.util.Optional<Simulacao> findByIdAndClienteId(java.util.UUID id, java.util.UUID clienteId);

  boolean existsByBemId(java.util.UUID bemId);
}
