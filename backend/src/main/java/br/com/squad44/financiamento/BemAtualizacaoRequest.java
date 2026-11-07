package br.com.squad44.financiamento;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** PUT /api/bens/{id}: tipoBem e clienteId não podem ser modificados. */
public record BemAtualizacaoRequest(
    @NotBlank @Size(max = 200) String descricao,
    @Size(max = 80) String identificacao,
    @NotBlank @Pattern(regexp = "novo|seminovo|usado") String condicaoBem,
    @NotNull @DecimalMin(value = "0", inclusive = false)
        @Digits(integer = 12, fraction = 2) BigDecimal valorNumerico) {}
