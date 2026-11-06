package br.com.squad44.financiamento;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    exclude =
        org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration
            .class)
public class FinanciamentosApplication {
  public static void main(String[] args) {
    SpringApplication.run(FinanciamentosApplication.class, args);
  }
}
