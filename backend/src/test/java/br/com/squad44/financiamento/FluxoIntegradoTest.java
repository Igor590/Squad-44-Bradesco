package br.com.squad44.financiamento;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FluxoIntegradoTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired ClienteRepository clientes;

  JsonNode body(MvcResult r) throws Exception {
    return json.readTree(r.getResponse().getContentAsString());
  }

  MvcResult send(String path, String data, MockHttpSession session, int status) throws Exception {
    var request = post(path).with(csrf()).contentType("application/json").content(data);
    if (session != null) request.session(session);
    return mvc.perform(request).andExpect(status().is(status)).andReturn();
  }

  MockHttpSession login(String cpf) throws Exception {
    return (MockHttpSession)
        send(
                "/api/auth/login",
                "{\"identifier\":\"" + cpf + "\",\"password\":\"Teste123!\"}",
                null,
                200)
            .getRequest()
            .getSession(false);
  }

  String cadastro(String cpf, String email, String renda) {
    return "{\"fullName\":\"Pessoa Teste\",\"cpf\":\""
        + cpf
        + "\",\"email\":\""
        + email
        + "\",\"phone\":\"81999999999\",\"nascimento\":\"1990-01-01\",\"renda\":"
        + renda
        + ",\"password\":\"Teste123!\",\"agreeTerms\":true}";
  }

  @Test
  void fluxoPersistenciaIsolamentoValidacoes() throws Exception {
    mvc.perform(get("/api/bens")).andExpect(status().isUnauthorized());
    mvc.perform(
            post("/api/auth/cadastro")
                .contentType("application/json")
                .content(cadastro("52998224725", "ana@example.com", "15000")))
        .andExpect(status().isForbidden());
    send("/api/auth/cadastro", cadastro("11111111111", "invalido@example.com", "15000"), null, 400);
    send("/api/auth/cadastro", cadastro("52998224725", "ana@example.com", "15000"), null, 201);
    send("/api/auth/cadastro", cadastro("52998224725", "ana@example.com", "15000"), null, 409);
    assertNotEquals(
        "Teste123!", clientes.findByCpfOrEmail("52998224725", "").orElseThrow().senhaHash);
    send("/api/auth/login", "{\"identifier\":\"52998224725\",\"password\":\"errada\"}", null, 401);
    var session = login("52998224725");
    mvc.perform(get("/api/auth/me").session(session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.senhaHash").doesNotExist());
    var b =
        body(
            send(
                "/api/bens",
                "{\"tipoBem\":\"veiculo\",\"descricao\":\"Carro"
                    + " teste\",\"identificacao\":\"ABC1D23\",\"condicaoBem\":\"novo\",\"valorNumerico\":12500}",
                session,
                201));
    String request =
        "{\"bemId\":\""
            + b.get("id").asText()
            + "\",\"entrada\":2500,\"prazoMeses\":12,\"taxaMensalPercentual\":1}";
    var s = body(send("/api/simulacoes", request, session, 201));
    assertEquals("888.49", s.at("/resultado/parcelaPadrao").asText());
    assertEquals(0, s.at("/resultado/parcelas/11/saldoDevedor").decimalValue().signum());
    String proposta = "{\"simulacaoId\":\"" + s.get("id").asText() + "\"}";
    var approved = body(send("/api/propostas", proposta, session, 200));
    assertEquals("APROVADO", approved.get("status").asText());
    assertEquals(
        approved.get("idProposta"),
        body(send("/api/propostas", proposta, session, 200)).get("idProposta"));
    send("/api/simulacoes", request.replace("2500", "12500"), session, 400);
    var over = body(send("/api/simulacoes", request.replace("2500,", "0,"), session, 201));
    var denied =
        body(
            send(
                "/api/propostas",
                "{\"simulacaoId\":\"" + over.get("id").asText() + "\"}",
                session,
                200));
    assertEquals("REPROVADO", denied.get("status").asText());
    assertTrue(denied.get("motivosReprovacao").toString().contains("90%"));
    send("/api/auth/cadastro", cadastro("11144477735", "bia@example.com", "100"), null, 201);
    var other = login("11144477735");
    mvc.perform(get("/api/bens").session(other)).andExpect(content().json("[]"));
    mvc.perform(get("/api/propostas").session(other)).andExpect(content().json("[]"));
    send("/api/simulacoes", request, other, 404);
    send("/api/propostas", proposta, other, 404);
    send("/api/auth/logout", "{}", session, 204);
    var again = login("52998224725");
    mvc.perform(get("/api/propostas").session(again)).andExpect(jsonPath("$.length()").value(2));
  }

  @Test
  void tokenCsrfReal() throws Exception {
    var csrfResult = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
    var token = body(csrfResult);
    var session = (MockHttpSession) csrfResult.getRequest().getSession(false);
    mvc.perform(
            post("/api/auth/login")
                .session(session)
                .header(token.get("headerName").asText(), token.get("token").asText())
                .contentType("application/json")
                .content("{\"identifier\":\"naoexiste@example.com\",\"password\":\"invalida\"}"))
        .andExpect(status().isUnauthorized());
  }
}
