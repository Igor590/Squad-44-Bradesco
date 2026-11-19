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

## Atualização em 19/11/2026

Contrato PDF e histórico persistente foram verificados nesta atualização.

- Suíte completa com H2, 24 testes sem falhas.
- Suíte completa em PostgreSQL 18.6 isolado, 24 testes sem falhas. Aplicadas V1, V2 e V3.
- Registro de parcela com atraso, cálculo de multa e mora, saldo principal, total em aberto e quitação.
- Reenvio de pagamento e duas requisições simultâneas da mesma parcela resultaram em um registro.
- Bloqueio de acesso por outro cliente e de POST sem CSRF. Rejeitados valor divergente e datas fora da contratação até hoje.
- Pagamento e saldo recuperados pela API HTTP após reiniciar o backend.
- Build e lint do frontend concluídos sem avisos.
- Fluxo da interface em jsdom com API simulada, incluindo falha recuperável no pagamento, histórico, quitação e troca de conta.
- PDF renderizado e inspecionado visualmente com dados da API PostgreSQL. Conferida paginação com descrições longas e 600 parcelas.

A interface foi exercitada em DOM simulado. A revisão manual final no navegador do usuário continua recomendada, especialmente o download de PDF e a navegação no celular. O PostgreSQL de trabalho do usuário não foi alterado nesta validação.

### Identificação do contrato

Após a V4, 25 testes passaram com H2, incluindo migração de contrato anterior à V4 e preservação do CPF e da identificação do bem após alterações nos cadastros. Build e lint passaram. O PDF com CPF, tipo do bem, identificação e primeiro/último vencimento foi renderizado e revisado visualmente em duas páginas. A V4 ainda requer confirmação no PostgreSQL local.

### Prévia do contrato e comprovante PDF

O botão Visualizar Contrato abre o PDF em um diálogo com download e fechamento. O painel textual que aparecia abaixo do cronograma foi substituído. A abertura, reabertura, fechamento por botão e cancelamento por Escape foram verificados em jsdom, incluindo a liberação das URLs temporárias. O download de comprovante em PDF foi exercitado no mesmo teste. Os PDFs de comprovante com observação e descrição extensas foram renderizados e inspecionados. Build e lint passaram. A inspeção direta no Safari ficou pendente porque o controle de permissões bloqueou o acesso ao aplicativo.
