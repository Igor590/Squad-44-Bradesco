# Validação desta entrega

Executada em 26/10/2026 com Java 17.

## Backend

`mvn verify`: concluído com sucesso. Seis métodos de teste JUnit, sem falhas ou erros, incluindo várias verificações por método:

- Cálculo Price: principal, parcela, total, última parcela e saldo final zero.
- Juros zero e entradas inválidas.
- Idade 17/18, renda igual/superior ao triplo, percentual 90%/acima e score 599/600.
- Cadastro inválido, cadastro duplicado e senha armazenada como hash.
- Login incorreto, sessão válida e acesso sem autenticação.
- Token CSRF real e bloqueio de POST sem token.
- Cadastro do bem, simulação, proposta aprovada e proposta reprovada.
- Reenvio sequencial sem duplicar proposta.
- Bloqueio do acesso a bens/simulações/propostas de outro usuário.
- Logout e novo login recuperando propostas salvas.

A migração Flyway e a validação do mapeamento JPA também foram executadas pelos testes.

## Frontend

`npm ci`, `npm run build` e `npm run lint`: concluídos com sucesso.

Fluxo de navegador Chromium automatizado com frontend Vite e backend HTTP reais:

1. Preencher cadastro (incluindo telefone), cadastrar e autenticar.
2. Cadastrar bem de R$ 12.500,00.
3. Calcular entrada de R$ 2.500,00, 12 meses, 1% mensal; conferir R$ 888,49 e R$ 13.161,86 na tela.
4. Enviar proposta e verificar aprovação.
5. Recarregar a página e recuperar proposta.
6. Simular entrada zero e verificar reprovação e motivo de 90%.
7. Verificar senha incorreta, logout e novo login com propostas preservadas.
8. Cadastrar segunda conta e confirmar lista vazia de propostas.
9. Revisar visual de simulação e acompanhamento em desktop e celular de 390 px; corrigido transbordamento horizontal.

## Limites da verificação

O banco usado nos testes automatizados e no navegador foi H2 em modo PostgreSQL. A execução normal do pacote usa PostgreSQL, com driver, URL e Flyway configurados; H2 fica somente no escopo de testes. Não foi possível executar um servidor PostgreSQL neste ambiente de validação, e o PostgreSQL 18 instalado no computador do usuário não é acessível daqui. Portanto a conexão, permissões e aplicação da migração nesse PostgreSQL devem ser confirmadas na primeira execução local.

Recarregamento da página e novo login foram testados. Reinício completo com PostgreSQL não foi testado aqui. Não foram realizados testes de carga, auditoria de segurança para produção ou publicação externa.
