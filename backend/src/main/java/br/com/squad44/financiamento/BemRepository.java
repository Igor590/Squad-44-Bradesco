package br.com.squad44.financiamento;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BemRepository extends JpaRepository<Bem, java.util.UUID> {
  java.util.List<Bem> findByClienteId(java.util.UUID clienteId);

  java.util.Optional<Bem> findByIdAndClienteId(java.util.UUID id, java.util.UUID clienteId);
}
