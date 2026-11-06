package br.com.squad44.financiamento;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "propostas")
public class Proposta {
  @Id public UUID id;

  @Column(nullable = false)
  public UUID clienteId;

  @Column(nullable = false, unique = true)
  public UUID simulacaoId;

  @Column(nullable = false)
  public Instant criadaEm;

  @Column(nullable = false, length = 20)
  public String status;

  @Column(nullable = false, columnDefinition = "text")
  public String motivosJson;

  @Column(nullable = false)
  public int idadeAnalisada;

  @Column(nullable = false, precision = 14, scale = 2)
  public BigDecimal rendaAnalisada;

  @Column(nullable = false)
  public int scoreAnalisado;
}
