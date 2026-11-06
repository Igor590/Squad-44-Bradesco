package br.com.squad44.financiamento;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public final class ApiDtos {
  public record Cadastro(
      @NotBlank @Size(max = 120) String fullName,
      @NotBlank @Pattern(regexp = "[0-9.\\- ]{11,14}") String cpf,
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(max = 20) String phone,
      @NotNull @Past LocalDate nascimento,
      @NotNull @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal renda,
      @NotBlank @Size(min = 8, max = 64) String password,
      @AssertTrue boolean agreeTerms) {}

  public record Login(
      @NotBlank @Size(max = 254) String identifier, @NotBlank @Size(max = 64) String password) {}

  public record CadastroBem(
      @NotBlank @Pattern(regexp = "veiculo|imovel|outro") String tipoBem,
      @NotBlank @Size(max = 200) String descricao,
      @Size(max = 80) String identificacao,
      @NotBlank @Pattern(regexp = "novo|seminovo|usado") String condicaoBem,
      @NotNull @DecimalMin(value = "0", inclusive = false) @Digits(integer = 12, fraction = 2)
          BigDecimal valorNumerico) {}

  public record PedidoSimulacao(
      @NotNull UUID bemId,
      @NotNull @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal entrada,
      @Min(1) @Max(600) int prazoMeses,
      @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 6)
          BigDecimal taxaMensalPercentual) {}

  public record PedidoProposta(@NotNull UUID simulacaoId) {}
}
