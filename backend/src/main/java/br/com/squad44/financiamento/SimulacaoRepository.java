package br.com.squad44.financiamento;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface SimulacaoRepository extends JpaRepository<Simulacao, UUID> {
  Optional<Simulacao> findByIdAndClienteId(UUID id, UUID clienteId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  Optional<Simulacao> findForUpdateByIdAndClienteId(UUID id, UUID clienteId);

  boolean existsByBemId(UUID bemId);
}
