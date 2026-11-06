package br.com.squad44.financiamento;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "bens")
public class Bem {
  @Id public UUID id;

  @Column(nullable = false)
  public UUID clienteId;

  @Column(nullable = false, length = 20)
  public String tipoBem;

  @Column(nullable = false, length = 200)
  public String descricao;

  @Column(nullable = false, length = 80)
  public String identificacao;

  @Column(nullable = false, length = 20)
  public String condicaoBem;

  @Column(nullable = false, precision = 14, scale = 2)
  public BigDecimal valorNumerico;
}
