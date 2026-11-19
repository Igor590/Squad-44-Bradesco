package br.com.squad44.financiamento;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PagamentoIntegradoTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired JdbcTemplate jdbc;
  @Autowired PagamentoService pagamentos;
  @Autowired ContratacaoService contratos;

  record Cenario(UUID cliente, UUID contrato) {}

  Cenario criar(int quantidade, LocalDate vencimento) {
    UUID cliente = UUID.randomUUID(), bem = UUID.randomUUID(), simulacao = UUID.randomUUID();
    UUID proposta = UUID.randomUUID(), contrato = UUID.randomUUID();
    String cpf = cliente.toString().replace("-", "").substring(0, 11);
    jdbc.update("""
        INSERT INTO clientes VALUES (?, 'Cliente Teste', ?, ?, '81999999999', '1990-01-01', 15000, 'hash', 700)
        """, cliente, cpf, cliente + "@teste.com");
    jdbc.update("INSERT INTO bens VALUES (?, ?, 'veiculo', 'Bem Teste', '', 'novo', 12500)", bem, cliente);
    var resultado = new SimuladorFinanciamento().simular(
        new BigDecimal("12500"), new BigDecimal("2500"), quantidade, BigDecimal.ONE);
    try {
      jdbc.update("INSERT INTO simulacoes VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)",
          simulacao, cliente, bem, json.writeValueAsString(resultado));
    } catch (Exception e) { throw new IllegalStateException(e); }
    jdbc.update("""
        INSERT INTO propostas VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'APROVADO', '[]', 30, 15000, 700)
        """, proposta, cliente, simulacao);
    jdbc.update("""
        INSERT INTO financiamentos
          (id, proposta_id, contratado_em, cliente_nome, bem_descricao, status, cliente_cpf, bem_tipo, bem_identificacao)
        VALUES (?, ?, ?, 'Cliente Teste', 'Bem Teste', 'ATIVO', ?, 'veiculo', 'ABC1D23')
        """, contrato, proposta, vencimento.minusMonths(1), cpf);
    for (int i = 1; i <= quantidade; i++) {
      jdbc.update("""
          INSERT INTO parcelas_financiamento VALUES (?, ?, ?, 1000, 100, 900, 'PENDENTE')
          """, contrato, i, vencimento);
    }
    return new Cenario(cliente, contrato);
  }

  PagamentoService.Pedido pedido(String valor) {
    return new PagamentoService.Pedido(PagamentoService.hoje(), new BigDecimal(valor), "PIX", "Teste");
  }

  @Test
  void registraEncargosSaldoHistoricoEQuitacaoSemDuplicidade() throws Exception {
    Cenario c = criar(2, PagamentoService.hoje().minusDays(2));
    String rota = "/api/financiamentos/" + c.contrato() + "/parcelas/1/pagamento";
    mvc.perform(post(rota).with(user(c.cliente().toString()))
        .contentType("application/json").content(json.writeValueAsString(pedido("1020.66"))))
        .andExpect(status().isForbidden());
    mvc.perform(post(rota).with(user(UUID.randomUUID().toString())).with(csrf())
        .contentType("application/json").content(json.writeValueAsString(pedido("1020.66"))))
        .andExpect(status().isNotFound());
    mvc.perform(post(rota).with(user(c.cliente().toString())).with(csrf())
        .contentType("application/json").content(json.writeValueAsString(pedido("1000"))))
        .andExpect(status().isConflict());
    var r = mvc.perform(post(rota).with(user(c.cliente().toString())).with(csrf())
        .contentType("application/json").content(json.writeValueAsString(pedido("1020.66"))))
        .andExpect(status().isOk()).andExpect(jsonPath("$.multa").value(20))
        .andExpect(jsonPath("$.jurosMora").value(.66)).andReturn();
    UUID pagamento = UUID.fromString(json.readTree(r.getResponse().getContentAsString()).get("idPagamento").asText());
    assertEquals(pagamento, pagamentos.registrar(c.cliente(), c.contrato(), 1, pedido("1020.66")).idPagamento());
    var detalhes = contratos.detalhar(c.cliente(), c.contrato());
    assertEquals(0, detalhes.saldoPrincipal().compareTo(new BigDecimal("900")));
    assertEquals(0, detalhes.totalEmAberto().compareTo(new BigDecimal("1020.66")));
    assertEquals("PAGA", detalhes.parcelas().get(0).status());
    assertEquals("ATRASADA", detalhes.parcelas().get(1).status());
    pagamentos.registrar(c.cliente(), c.contrato(), 2, pedido("1020.66"));
    assertEquals("QUITADO", contratos.detalhar(c.cliente(), c.contrato()).contrato().status());
    assertEquals(0, contratos.detalhar(c.cliente(), c.contrato()).saldoPrincipal().signum());
    mvc.perform(get("/api/pagamentos").with(user(c.cliente().toString())))
        .andExpect(jsonPath("$.length()").value(2));
    mvc.perform(get("/api/pagamentos").with(user(UUID.randomUUID().toString())))
        .andExpect(content().json("[]"));
    mvc.perform(get("/api/pagamentos")).andExpect(status().isUnauthorized());
  }

  @Test
  void serializaPagamentosConcorrentesDaMesmaParcela() throws Exception {
    Cenario c = criar(1, PagamentoService.hoje().plusMonths(1));
    ExecutorService pool = Executors.newFixedThreadPool(2);
    CountDownLatch inicio = new CountDownLatch(1);
    try {
      Callable<UUID> tarefa = () -> {
        inicio.await();
        return pagamentos.registrar(c.cliente(), c.contrato(), 1, pedido("1000")).idPagamento();
      };
      Future<UUID> a = pool.submit(tarefa), b = pool.submit(tarefa);
      inicio.countDown();
      assertEquals(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS));
      assertEquals(1, pagamentos.historico(c.cliente()).size());
    } finally {
      pool.shutdownNow();
    }
  }

  @Test
  void rejeitaPagamentoFuturoEAnteriorAContratacao() {
    Cenario c = criar(1, PagamentoService.hoje().plusDays(10));
    assertThrows(org.springframework.web.server.ResponseStatusException.class,
        () -> pagamentos.registrar(c.cliente(), c.contrato(), 1,
            new PagamentoService.Pedido(PagamentoService.hoje().plusDays(1), new BigDecimal("1000"), "PIX", "")));
    assertThrows(org.springframework.web.server.ResponseStatusException.class,
        () -> pagamentos.registrar(c.cliente(), c.contrato(), 1,
            new PagamentoService.Pedido(PagamentoService.hoje().minusYears(1), new BigDecimal("1000"), "PIX", "")));
  }
}
