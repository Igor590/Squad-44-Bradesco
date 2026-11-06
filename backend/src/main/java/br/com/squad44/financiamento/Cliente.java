package br.com.squad44.financiamento;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "clientes")
public class Cliente {
  @Id public UUID id;

  @Column(nullable = false, length = 120)
  public String nome;

  @Column(nullable = false, unique = true, length = 11)
  public String cpf;

  @Column(nullable = false, unique = true, length = 254)
  public String email;

  @Column(nullable = false, length = 11)
  public String telefone;

  @Column(nullable = false)
  public LocalDate nascimento;

  @Column(nullable = false, precision = 14, scale = 2)
  public BigDecimal renda;

  @Column(nullable = false, length = 100)
  public String senhaHash;

  @Column(nullable = false)
  public int score;
}
