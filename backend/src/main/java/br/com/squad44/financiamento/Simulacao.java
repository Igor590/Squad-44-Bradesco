package br.com.squad44.financiamento;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "simulacoes")
public class Simulacao {
  @Id public UUID id;

  @Column(nullable = false)
  public UUID clienteId;

  @Column(nullable = false)
  public UUID bemId;

  @Column(nullable = false)
  public Instant criadaEm;

  @Column(nullable = false, columnDefinition = "text")
  public String resultadoJson;
}
