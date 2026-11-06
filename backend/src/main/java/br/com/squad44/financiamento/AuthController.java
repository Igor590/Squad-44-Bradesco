package br.com.squad44.financiamento;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final ClienteRepository clientes;
  private final PasswordEncoder encoder;
  private final SecurityContextRepository contexts;
  private final int score;
  private final String dummyHash;

  public AuthController(
      ClienteRepository c,
      PasswordEncoder e,
      SecurityContextRepository s,
      @Value("${app.score-demonstrativo}") int score) {
    clientes = c;
    encoder = e;
    contexts = s;
    this.score = score;
    dummyHash = e.encode(UUID.randomUUID().toString());
  }

  @GetMapping("/csrf")
  public Map<String, String> csrf(CsrfToken token) {
    return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
  }

  @PostMapping("/cadastro")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> cadastro(@Valid @RequestBody ApiDtos.Cadastro d) {
    String cpf = d.cpf().replaceAll("\\D", "");
    String email = d.email().trim().toLowerCase(Locale.ROOT);
    if (!cpfValido(cpf)) throw new IllegalArgumentException("CPF inválido. Confira os dígitos.");
    String phone = d.phone().replaceAll("\\D", "");
    if (phone.length() < 10 || phone.length() > 11)
      throw new IllegalArgumentException("Telefone deve ter 10 ou 11 dígitos com DDD.");
    if (d.fullName().trim().split("\\s+").length < 2)
      throw new IllegalArgumentException("Informe nome e sobrenome.");
    if (!d.password().matches("(?s).*[0-9].*")
        || d.password().getBytes(StandardCharsets.UTF_8).length > 72)
      throw new IllegalArgumentException(
          "Senha deve conter número e ter no máximo 72 bytes UTF-8.");
    if (clientes.existsByCpfOrEmail(cpf, email))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF ou e-mail já cadastrado.");
    Cliente c = new Cliente();
    c.id = UUID.randomUUID();
    c.nome = d.fullName().trim();
    c.cpf = cpf;
    c.email = email;
    c.telefone = phone;
    c.nascimento = d.nascimento();
    c.renda = d.renda();
    c.score = score;
    c.senhaHash = encoder.encode(d.password());
    return view(clientes.saveAndFlush(c));
  }

  @PostMapping("/login")
  public Map<String, Object> login(
      @Valid @RequestBody ApiDtos.Login d,
      HttpServletRequest request,
      HttpServletResponse response) {
    String identifier = d.identifier().trim().toLowerCase(Locale.ROOT);
    Cliente c =
        clientes.findByCpfOrEmail(identifier.replaceAll("\\D", ""), identifier).orElse(null);
    boolean match = encoder.matches(d.password(), c == null ? dummyHash : c.senhaHash);
    if (c == null || !match)
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "CPF/e-mail ou senha incorretos.");
    if (request.getSession(false) != null) request.getSession(false).invalidate();
    request.getSession(true);
    var context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(
        new UsernamePasswordAuthenticationToken(c.id.toString(), null, List.of()));
    SecurityContextHolder.setContext(context);
    contexts.saveContext(context, request, response);
    return view(c);
  }

  @GetMapping("/me")
  public Map<String, Object> me(Authentication a) {
    return view(clientes.findById(UUID.fromString(a.getName())).orElseThrow());
  }

  static Map<String, Object> view(Cliente c) {
    return Map.of(
        "id",
        c.id,
        "name",
        c.nome,
        "identifier",
        c.cpf,
        "email",
        c.email,
        "segment",
        "Acadêmico",
        "renda",
        c.renda,
        "nascimento",
        c.nascimento,
        "score",
        c.score,
        "scoreDemonstrativo",
        true);
  }

  static boolean cpfValido(String s) {
    if (!s.matches("[0-9]{11}") || s.chars().distinct().count() == 1) return false;
    for (int n = 9; n <= 10; n++) {
      int sum = 0;
      for (int i = 0; i < n; i++) sum += (s.charAt(i) - '0') * (n + 1 - i);
      int v = (sum * 10) % 11;
      if (v == 10) v = 0;
      if (v != s.charAt(n) - '0') return false;
    }
    return true;
  }
}
