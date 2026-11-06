package br.com.squad44.financiamento;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, java.util.UUID> {
  java.util.Optional<Cliente> findByCpfOrEmail(String cpf, String email);

  boolean existsByCpfOrEmail(String cpf, String email);
}
