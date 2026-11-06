# Squad 44 | Sistema de Gerenciamento de Financiamentos

Pessoal, deixei aqui o que precisamos para rodar e testar nossa versão integrada do projeto da Residência GrowUp. Quem está abrindo pela primeira vez pode seguir os passos na ordem. Quem já tem tudo configurado pode ir direto para **Rodar no dia a dia**.

## O que temos nesta versão

O cliente cria uma conta, entra com CPF ou e-mail, cadastra um bem e simula o financiamento. Antes de enviar a proposta, ele já consegue ver a parcela, os juros, o total com entrada e o cronograma. Ao enviar, recebe um protocolo e a decisão da análise. Se houver reprovação, o sistema mostra os motivos. Cada cliente só consegue consultar os próprios bens e propostas.

A aprovação encerra o fluxo desta entrega. O cronograma da simulação mostra uma **previsão** das parcelas; geração do contrato, cobrança, registro de pagamentos e cálculo de atraso ficam para as próximas etapas.

| Onde mexer | O que tem ali |
|---|---|
| `frontend/` | Telas em React. O Vite encaminha as chamadas `/api` para o Java. |
| `backend/` | API em Spring Boot com Java 17. Aqui ficam o login, o cálculo e as regras de aprovação. |
| `backend/src/main/resources/db/migration/` | Scripts SQL que o Flyway aplica no PostgreSQL. |
| `docs/` | Detalhes da API, arquitetura e validações da entrega. |

## Primeira execução

Vamos usar Git, JDK 17, IntelliJ, PostgreSQL e Node.js com npm. Para o front, podemos usar Node 24. O Maven já vem integrado ao IntelliJ. Os comandos abaixo são para PowerShell.

**1. Baixar o projeto.** Na pasta onde costumam guardar os projetos, rodem:

```powershell
git clone https://github.com/Igor590/Squad-44-Bradesco.git
cd Squad-44-Bradesco
```

Se já tiverem clonado, basta abrir essa pasta. A versão integrada tem `backend/` e `frontend/` na raiz. Se a `main` ainda mostrar só as classes Java antigas, rodem `git fetch origin` e depois `git switch integracao-front-back`.

**2. Preparar o banco local.** Cada integrante faz isso uma vez no próprio computador. O GitHub compartilha a estrutura do banco; as contas criadas em uma máquina não aparecem nas outras.

1. No pgAdmin, conectem ao servidor local com o usuário administrador `postgres`.
2. Em **Login/Group Roles → Create → Login/Group Role**, criem `bradesco_app`. Escolham uma senha em **Definition** e ativem **Can login?** em **Privileges**. Não precisa marcar **Superuser**.
3. Em **Databases → Create → Database**, criem `bradesco_financiamentos` e escolham `bradesco_app` como **Owner**.
4. Deixem o banco vazio. Na primeira inicialização, o backend cria as tabelas `clientes`, `bens`, `simulacoes` e `propostas`. Depois disso, basta manter o serviço do PostgreSQL ligado; a janela do pgAdmin pode ficar fechada.

**3. Iniciar o backend.** No IntelliJ, abram **File → Open → `backend/pom.xml`** como projeto Maven. Selecionem o JDK 17 em **Project Structure → Project** e aguardem a importação das dependências.

A classe que inicia o sistema é `FinanciamentosApplication`. Na configuração de execução dessa classe (**Run → Edit Configurations**), abram **Environment variables**. Se o campo estiver oculto, usem **Modify options**. Esses são os valores:

| Variável | Valor local |
|---|---|
| `DB_PASSWORD` | Senha que cada um definiu para `bradesco_app` |
| `DB_USER` | `bradesco_app` (padrão do projeto) |
| `DB_URL` | `jdbc:postgresql://localhost:5432/bradesco_financiamentos` (padrão do projeto) |

Se usaram os nomes e a porta acima, só precisam informar `DB_PASSWORD`. A senha fica na configuração local do IntelliJ. Executem a classe pelo botão verde e esperem a mensagem **Started FinanciamentosApplication** no console.

**4. Abrir o frontend.** Com o backend rodando, abram o PowerShell na raiz do repositório:

```powershell
cd frontend
npm ci
npm run dev
```

Abram **http://127.0.0.1:5173**. Essa é a interface; a porta `8080` é da API. Deixem o terminal aberto enquanto estiverem usando o sistema.

## Rodar no dia a dia

Com o PostgreSQL ligado, executem `FinanciamentosApplication` no IntelliJ e rodem `npm run dev` na pasta `frontend`. Não é preciso clonar o projeto, criar o banco ou instalar as dependências toda vez. Se uma atualização mudar o `package-lock.json`, rodem `npm ci` novamente. Para encerrar, usem `Ctrl+C` no terminal do front e **Stop** no IntelliJ. Os dados continuam no banco.

## Como conferir se a integração funcionou

1. Em **Criar conta**, usem **Preencher dados de exemplo** e concluam o cadastro. Entrem com a mesma conta. O CPF precisa ter dígitos verificadores válidos e o sistema não aceita CPF ou e-mail duplicado. Se já testaram com essa conta, basta fazer login.
2. Cadastrem um bem de **R$ 12.500,00**. Na simulação, usem **R$ 2.500,00 de entrada**, **12 meses** e **1% ao mês**.
3. Cliquem em **Calcular financiamento**. O esperado é **R$ 10.000,00 financiados**, 11 parcelas de **R$ 888,49** e a última de **R$ 888,47**. Os juros somam **R$ 661,86**, e o total **com a entrada** é **R$ 13.161,86**.
4. Enviem a proposta com a conta de exemplo (renda de R$ 15.000,00). Ela deve ser aprovada. Para mostrar uma reprovação, mantenham os dados do bem e façam outra simulação com **entrada zero**: o percentual financiado passa para 100%, acima do limite de 90%.
5. Saiam e entrem novamente. As duas propostas devem continuar no acompanhamento, cada uma com seu protocolo. Outra conta deve ter seu próprio histórico.

**Como explicar o resultado:** a parcela é calculada no Java pela Tabela Price. A taxa da tela é mensal e a última parcela pode variar alguns centavos para zerar o saldo. A análise exige renda **maior que** três vezes a maior parcela, percentual financiado **até 90%** e score **a partir de 600**. Nesta versão, o backend atribui score demonstrativo de 700 a novos clientes; não consultamos um serviço externo. A regra implementada aceita **18 anos completos**. Precisamos alinhar esse limite com o enunciado original, que diz “mais de 18”.

## Como vamos trabalhar pelo GitHub

Depois que a integração estiver na `main`, comecem cada tarefa a partir dela. Exemplo para quem for trabalhar em contratos:

```powershell
git switch main
git pull --ff-only
git switch -c feat/contratos
```

Façam a alteração, testem e usem `git status` para conferir os arquivos. Para conferir o backend, rodem **Maven → Lifecycle → test** no IntelliJ. Se mexerem no front, rodem `npm run build` e `npm run lint` na pasta `frontend`. Os testes automáticos do Java usam H2 isolado; para conferir a integração com PostgreSQL, usem o roteiro acima.

Quando a tarefa estiver pronta, adicionem só os arquivos relacionados, façam o commit e enviem a branch. No exemplo de uma alteração dentro de `backend/`, a partir da raiz:

```powershell
git add backend/
git diff --cached --stat
git commit -m "Adiciona geração de contrato após aprovação"
git push -u origin feat/contratos
```

No GitHub, abram o **Pull Request** para a `main` e descrevam o que mudou e como testar. Assim outra pessoa do squad consegue revisar antes do merge. Senhas, configurações pessoais da IDE, `node_modules`, `target` e `dist` ficam fora do repositório.

## Se algo travar

| O que apareceu | O que conferir primeiro |
|---|---|
| Erro de senha ou `DB_PASSWORD` ausente | A variável deve estar na execução de **FinanciamentosApplication**, com a senha de `bradesco_app`. |
| Conexão recusada na porta 5432 | Verifiquem se o PostgreSQL está iniciado e se a porta coincide com a de `DB_URL`. |
| Permissão negada ao criar tabelas | No pgAdmin, confiram se `bradesco_app` é o proprietário do banco. |
| A tela abre, mas cadastro/login falha por conexão | Confiram no IntelliJ se o backend terminou de iniciar na porta 8080. |
| CPF inválido ou já cadastrado | Para um primeiro teste, usem o preenchimento de exemplo. Se o cadastro já existe, entrem pela aba de login. |

Se precisarem de ajuda no grupo, mandem a etapa em que parou e a primeira mensagem de erro do console. Isso ajuda a identificar se o problema está no banco, no Java ou no front.
