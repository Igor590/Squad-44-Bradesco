package br.com.squad44.financiamento;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.*;
import org.springframework.security.web.csrf.*;

@Configuration
public class SegurancaConfig {
  @Bean
  PasswordEncoder encoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  SecurityContextRepository contextRepository() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  SecurityFilterChain filter(HttpSecurity http, SecurityContextRepository repo) throws Exception {
    http.securityContext(c -> c.securityContextRepository(repo))
        .csrf(c -> c.csrfTokenRepository(new HttpSessionCsrfTokenRepository()))
        .authorizeHttpRequests(
            a ->
                a.requestMatchers(
                        "/api/auth/csrf", "/api/auth/cadastro", "/api/auth/login", "/error")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint(
                        (q, s, x) -> {
                          s.setStatus(401);
                          s.setContentType("application/json;charset=UTF-8");
                          s.getWriter()
                              .write("{\"message\":\"Entre na sua conta para continuar.\"}");
                        })
                    .accessDeniedHandler(
                        (q, s, x) -> {
                          s.setStatus(403);
                          s.setContentType("application/json;charset=UTF-8");
                          s.getWriter()
                              .write(
                                  "{\"message\":\"Sessão inválida. Atualize a página e tente"
                                      + " novamente.\"}");
                        }))
        .logout(
            l ->
                l.logoutUrl("/api/auth/logout")
                    .logoutSuccessHandler((q, s, a) -> s.setStatus(204)));
    return http.build();
  }
}
