package br.com.squad44.financiamento;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional // Cada teste e seus dados são revertidos ao final.
class BemControllerIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ClienteRepository clientes;
  @Autowired BemRepository bens;
  @Autowired SimulacaoRepository simulacoes;

  private Cliente dono;
  private Cliente outro;
  private Bem bem;

  @BeforeEach
  void prepararDados() {
    dono = criarCliente();
    outro = criarCliente();
    bem = criarBem(dono);
  }

  @Test
  void getPermiteAoDonoMasNaoAoOutroCliente() throws Exception {
    mvc.perform(get("/api/bens/{id}", bem.id))
        .andExpect(status().isUnauthorized());

    mvc.perform(get("/api/bens/{id}", bem.id).with(user(dono.id.toString())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(bem.id.toString()))
        .andExpect(jsonPath("$.descricao").value("Carro de teste"));

    mvc.perform(get("/api/bens/{id}", bem.id).with(user(outro.id.toString())))
        .andExpect(status().isNotFound());
  }

  @Test
  void putAtualizaCamposPermitidosSemAlterarIdOuProprietario() throws Exception {
    mvc.perform(put("/api/bens/{id}", bem.id)
            .with(user(dono.id.toString()))
            .with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"descricao":"Carro atualizado", "identificacao":"NOVA123",
                 "condicaoBem":"novo", "valorNumerico":85000.00}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(bem.id.toString()))
        .andExpect(jsonPath("$.clienteId").value(dono.id.toString()))
        .andExpect(jsonPath("$.tipoBem").value("veiculo"))
        .andExpect(jsonPath("$.descricao").value("Carro atualizado"))
        .andExpect(jsonPath("$.identificacao").value("NOVA123"));

    bens.flush();
    Bem persistido = bens.findById(bem.id).orElseThrow();
    assertEquals("Carro atualizado", persistido.descricao);
    assertEquals(0, new BigDecimal("85000.00").compareTo(persistido.valorNumerico));
  }

  @Test
  void putRejeitaDadosInvalidos() throws Exception {
    mvc.perform(put("/api/bens/{id}", bem.id)
            .with(user(dono.id.toString()))
            .with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"descricao":"", "identificacao":"ABC1234",
                 "condicaoBem":"invalido", "valorNumerico":-10}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.fields.descricao").exists())
        .andExpect(jsonPath("$.fields.condicaoBem").exists())
        .andExpect(jsonPath("$.fields.valorNumerico").exists());
  }

  @Test
  void putEDeleteNaoAceitamOutroCliente() throws Exception {
    mvc.perform(put("/api/bens/{id}", bem.id)
            .with(user(outro.id.toString()))
            .with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"descricao":"Tentativa", "identificacao":"ABC1234",
                 "condicaoBem":"novo", "valorNumerico":50000}
                """))
        .andExpect(status().isNotFound());

    mvc.perform(delete("/api/bens/{id}", bem.id)
            .with(user(outro.id.toString()))
            .with(csrf()))
        .andExpect(status().isNotFound());

    assertTrue(bens.existsById(bem.id));
  }

  @Test
  void putEDeleteExigemTokenCsrf() throws Exception {
    mvc.perform(put("/api/bens/{id}", bem.id)
            .with(user(dono.id.toString()))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"descricao":"Carro", "identificacao":"ABC1234",
                 "condicaoBem":"novo", "valorNumerico":80000}
                """))
        .andExpect(status().isForbidden());

    mvc.perform(delete("/api/bens/{id}", bem.id)
            .with(user(dono.id.toString())))
        .andExpect(status().isForbidden());
  }

  @Test
  void deleteRemoveBemSemSimulacoes() throws Exception {
    mvc.perform(delete("/api/bens/{id}", bem.id)
            .with(user(dono.id.toString()))
            .with(csrf()))
        .andExpect(status().isNoContent());

    assertFalse(bens.existsById(bem.id));
  }

  @Test
  void deleteBloqueiaBemVinculadoASimulacao() throws Exception {
    Simulacao simulacao = new Simulacao();
    simulacao.id = UUID.randomUUID();
    simulacao.clienteId = dono.id;
    simulacao.bemId = bem.id;
    simulacao.criadaEm = Instant.now();
    simulacao.resultadoJson = "{}";
    simulacoes.saveAndFlush(simulacao);

    mvc.perform(delete("/api/bens/{id}", bem.id)
            .with(user(dono.id.toString()))
            .with(csrf()))
        .andExpect(status().isUnprocessableEntity());

    assertTrue(bens.existsById(bem.id));
  }

  private Cliente criarCliente() {
    Cliente cliente = new Cliente();
    cliente.id = UUID.randomUUID();
    cliente.nome = "Pessoa de Teste";
    cliente.cpf = String.format("%011d", Math.floorMod(cliente.id.getMostSignificantBits(), 100_000_000_000L));
    cliente.email = cliente.id + "@example.com";
    cliente.telefone = "81999999999";
    cliente.nascimento = LocalDate.of(1995, 1, 1);
    cliente.renda = new BigDecimal("15000.00");
    cliente.senhaHash = "hash-so-para-teste";
    cliente.score = 700;
    return clientes.saveAndFlush(cliente);
  }

  private Bem criarBem(Cliente cliente) {
    Bem novo = new Bem();
    novo.id = UUID.randomUUID();
    novo.clienteId = cliente.id;
    novo.tipoBem = "veiculo";
    novo.descricao = "Carro de teste";
    novo.identificacao = "ABC1234";
    novo.condicaoBem = "seminovo";
    novo.valorNumerico = new BigDecimal("80000.00");
    return bens.saveAndFlush(novo);
  }
}
