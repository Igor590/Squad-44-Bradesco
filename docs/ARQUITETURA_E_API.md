# Arquitetura e API

## Fluxo

React envia JSON pelo proxy Vite → Spring Security valida sessão/CSRF → Controller valida DTO → Service executa regra e transação → Repository/JPA acessa PostgreSQL → DTO JSON retorna à tela.

O cálculo não depende de HTTP: `SimuladorFinanciamento`, `ResultadoSimulacao`, `ParcelaSimulada` e `ServicoAnalise` são classes Java puras. Os controllers cuidam das entradas HTTP; `FinanciamentoService` coordena bens, simulações e propostas. `AuthController` coordena cadastro e autenticação; em uma evolução maior, essa lógica pode ser extraída para AuthService.

## Persistência

- **clientes**: UUID PK, CPF/e-mail únicos, nome, telefone, nascimento, renda, hash BCrypt, score de demonstração.
- **bens**: UUID PK, cliente_id FK, tipo/modalidade dentro do bem, descrição, identificação, condição e valor.
- **simulacoes**: UUID PK, cliente_id/bem_id FKs, instante, resultado imutável em JSON textual.
- **propostas**: UUID PK, cliente_id/simulacao_id FKs, simulacao_id único, instante, status, motivos e cópia de idade/renda/score usados na análise.

A V2 registra a contratação em `financiamentos` e gera `parcelas_financiamento` com os valores do cronograma aprovado. O primeiro vencimento é no mês seguinte, mantendo o dia da contratação ou usando o último dia do mês quando necessário. A geração vale para novas aprovações. A V3 registra pagamentos integrais com valor original, multa e juros de mora separados. A consulta calcula o atraso das parcelas em aberto e preserva os encargos das parcelas pagas. A multa de 2% inicia no segundo dia de atraso. Os juros são de 0,033% ao dia sobre o valor original. JSON textual foi escolhido para preservar os valores exatos da simulação sem depender de tipos específicos do banco nos testes.

Relacionamentos são verificados por FKs no banco. A propriedade de cada recurso é verificada no serviço com o ID do usuário autenticado. A aplicação não recebe clienteId do navegador para decidir o dono. Não existem endpoints de alteração de bens/clientes nesta versão.

## Endpoints

| Método | Rota | Função |
|---|---|---|
| GET | /api/auth/csrf | Obter token CSRF e nome do header |
| POST | /api/auth/cadastro | Criar cliente (201), sem login automático |
| POST | /api/auth/login | Autenticar com CPF ou e-mail (200) |
| GET | /api/auth/me | Consultar usuário conectado |
| POST | /api/auth/logout | Encerrar sessão (204) |
| GET | /api/bens | Listar bens do usuário |
| POST | /api/bens | Cadastrar bem (201) |
| POST | /api/simulacoes | Calcular e persistir simulação (201) |
| POST | /api/propostas | Converter simulação em proposta e analisar (200) |
| GET | /api/propostas | Listar propostas do usuário |
| GET | /api/financiamentos | Listar contratos e financiamentos do usuário |
| GET | /api/financiamentos/{id} | Obter contrato, parcelas, saldo principal e total em aberto com encargos |
| GET | /api/pagamentos | Histórico dos pagamentos do cliente |
| POST | /api/financiamentos/{id}/parcelas/{numero}/pagamento | Registrar pagamento integral da parcela |

Todos os POST exigem token CSRF, inclusive cadastro/login. Primeiro obtenha `/api/auth/csrf`, preserve o cookie e envie o header indicado na resposta. O login renova a sessão, portanto obtenha novo CSRF para ações posteriores. O frontend faz isso automaticamente. Sessão dura 30 minutos de inatividade, com cookie HttpOnly/SameSite=Lax, sem guardar senha ou autenticação em localStorage. Sem CORS aberto: durante desenvolvimento o proxy mantém a mesma origem.

## Exemplos de entrada

Cadastro:
```json
{"fullName":"Mariana Duarte Souza","cpf":"52998224725","email":"mariana.duarte@email.com.br","phone":"11987654321","nascimento":"1995-05-20","renda":15000,"password":"Bradesco#2026","agreeTerms":true}
```

Login:
```json
{"identifier":"mariana.duarte@email.com.br","password":"Bradesco#2026"}
```

Bem:
```json
{"tipoBem":"veiculo","descricao":"Veículo de demonstração","identificacao":"ABC1D23","condicaoBem":"seminovo","valorNumerico":12500}
```

Simulação (substitua pelo UUID retornado no cadastro do bem):
```json
{"bemId":"UUID_DO_BEM","entrada":2500,"prazoMeses":12,"taxaMensalPercentual":1}
```

Retorna `id` da simulação e `resultado` com valores e cronograma. Envio da proposta:
```json
{"simulacaoId":"UUID_DA_SIMULACAO"}
```

Retorna `idProposta`, `dataSolicitacao`, `bemDescricao`, `status`, `motivosReprovacao`, `resultado`, `scoreDemonstrativo`. Status usa EM_ANALISE/APROVADO/REPROVADO; a interface traduz os rótulos. Valores monetários são números JSON, formatados em reais apenas na tela.

## Erros

- 400: dados inválidos, CPF inválido, entrada integral, prazo ou taxa inválidos.
- 401: login incorreto ou acesso sem sessão.
- 403: token CSRF inválido.
- 404: bem/simulação inexistente ou pertencente a outro usuário.
- 409: duplicidade ou conflito de integridade.

Erros controlados retornam `message`; validação de campos inclui `fields`. Reprovação de crédito é uma resposta de negócio 200, não erro HTTP. Timeout da interface: 15 segundos; após timeout de envio, conferir acompanhamento antes de repetir. Não há retentativa automática de POST. Erros internos não retornam stack trace ao cliente.

## Testes

No painel Maven, execute Lifecycle → test. Ou, com JAVA_HOME configurado:
```bat
mvnw.cmd test
```

Os testes usam H2 isolado em modo PostgreSQL; não conectam ao banco real. O H2 é dependência somente de teste e não substitui PostgreSQL na execução normal. Não ative perfil `test` para a apresentação.


## Registro de pagamentos

O formulário registra pagamento integral na data de hoje. A API aceita uma data entre a contratação e hoje, para registro de um pagamento já realizado. O backend calcula o valor devido naquela data e exige que `valorPago` coincida. Um valor divergente retorna 409. Valores parciais são rejeitados.

O pagamento antecipado de uma parcela usa seu valor contratado, sem desconto adicional. Essa decisão acadêmica precisa ser alinhada ao escopo do squad.

O payload contém `dataPagamento` (AAAA-MM-DD), `valorPago`, `formaPagamento` e `observacao` opcional. Formas aceitas são PIX, Débito em Conta Bradesco, Boleto e Transferência. A forma registra a informação fornecida pelo cliente. O sistema não processa transferências.

O financiamento é bloqueado durante o registro. Reenvios da mesma parcela retornam o registro já salvo. Pagamento, situação da parcela e quitação são atualizados na mesma transação. A quitação acontece quando todas as parcelas estão pagas.

`saldoPrincipal` soma as amortizações em aberto. `totalEmAberto` soma os valores das parcelas em aberto com encargos calculados na data da consulta. O histórico usa os valores gravados na data de cada pagamento.

## Contrato PDF

O frontend gera PDF A4 dos dados retornados pela API com jsPDF e tabelas paginadas. O documento contém identificação, condições financeiras, regras acadêmicas e cronograma completo. O download é feito localmente no navegador, sob demanda.


A V4 preserva CPF do cliente, tipo e identificação do bem no registro da contratação. Para contratos anteriores à V4, esses campos são complementados uma vez com os cadastros disponíveis na atualização e o PDF informa essa origem. Nas novas contratações, todos esses dados são copiados na mesma transação da geração das parcelas.
