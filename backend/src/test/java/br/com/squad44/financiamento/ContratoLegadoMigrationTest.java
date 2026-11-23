package br.com.squad44.financiamento;

import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

class ContratoLegadoMigrationTest {
  @Test
  void complementaContratoExistenteEPreservaIdentificacaoAposEditarOBem() {
    var fonte = new DriverManagerDataSource(
        "jdbc:h2:mem:legado" + UUID.randomUUID() + ";MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "sa", "");
    Flyway.configure().dataSource(fonte).target("3").load().migrate();
    var jdbc = new JdbcTemplate(fonte);
    UUID cliente = UUID.randomUUID(), bem = UUID.randomUUID(), simulacao = UUID.randomUUID();
    UUID proposta = UUID.randomUUID(), contrato = UUID.randomUUID();
    jdbc.update("""
        INSERT INTO clientes VALUES (?, 'Cliente Teste', '52998224725', 'legado@teste.com',
        '81999999999', '1990-01-01', 15000, 'hash', 700)
        """, cliente);
    jdbc.update("INSERT INTO bens VALUES (?, ?, 'veiculo', 'Bem Teste', 'ABC1D23', 'novo', 12500)", bem, cliente);
    jdbc.update("INSERT INTO simulacoes VALUES (?, ?, ?, CURRENT_TIMESTAMP, '{}')", simulacao, cliente, bem);
    jdbc.update("""
        INSERT INTO propostas VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'APROVADO', '[]', 30, 15000, 700)
        """, proposta, cliente, simulacao);
    jdbc.update("""
        INSERT INTO financiamentos VALUES (?, ?, CURRENT_DATE, 'Cliente Teste', 'Bem Teste', 'ATIVO')
        """, contrato, proposta);
    Flyway.configure().dataSource(fonte).load().migrate();
    jdbc.update("UPDATE bens SET identificacao = 'EDITADO' WHERE id = ?", bem);
    var dados = jdbc.queryForMap("SELECT * FROM financiamentos WHERE id = ?", contrato);
    assertEquals("52998224725", dados.get("CLIENTE_CPF"));
    assertEquals("veiculo", dados.get("BEM_TIPO"));
    assertEquals("ABC1D23", dados.get("BEM_IDENTIFICACAO"));
    assertEquals(true, dados.get("IDENTIFICACAO_COMPLEMENTADA"));
    assertEquals("Cliente Teste", dados.get("CLIENTE_NOME"));
  }
}
