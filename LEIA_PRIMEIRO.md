# Bradesco • Squad 44 — aplicação integrada

Versão de demonstração acadêmica, preparada em 26/10/2026.

## O que funciona

Cadastro de cliente, login/logout com sessão, cadastro e seleção de bens, cálculo Price no Java, envio de proposta, análise automática e consulta das propostas do cliente autenticado. Dados persistidos no PostgreSQL. O layout React existente foi aproveitado.

## 1. Banco de dados

Você já criou `bradesco_financiamentos` com proprietário `bradesco_app`. Mantenha o serviço do PostgreSQL iniciado. Não é necessário manter a janela do pgAdmin aberta.

Nenhuma tabela precisa ser criada manualmente: o Flyway executa `backend/src/main/resources/db/migration/V1__estrutura_inicial.sql` na primeira inicialização. O banco precisa estar vazio ou ter sido criado para este pacote. A migração cria `clientes`, `bens`, `simulacoes`, `propostas` e a tabela de histórico do Flyway. Não apaga o banco ao reiniciar.

## 2. Backend pelo IntelliJ (Java 17)

1. Extraia o ZIP em uma pasta nova. Não misture com as classes soltas do projeto antigo.
2. No IntelliJ: **File → Open**, selecione `backend/pom.xml` e escolha abrir como projeto. Confie no projeto se a IDE solicitar.
3. Em **File → Project Structure → Project**, escolha o JDK 17 que você já tem.
4. Em **Settings → Build, Execution, Deployment → Build Tools → Maven**, use **Bundled Maven** (ou Maven Wrapper). Em **Runner**, selecione JDK 17/Project JDK; em **Importing**, selecione o mesmo JDK se essa opção aparecer.
5. Aguarde a importação. Se necessário, abra o painel Maven e clique em **Reload All Maven Projects**. A primeira execução precisa de internet para baixar dependências.
6. Abra `src/main/java/br/com/squad44/financiamento/FinanciamentosApplication.java` e crie uma configuração de execução para o método `main` pelo ícone verde ao lado dele. Se a primeira tentativa reclamar da senha, pare-a e configure o próximo passo.
7. Em **Run → Edit Configurations**, selecione a configuração da aplicação. Em **Environment variables** (se oculto, use **Modify options → Environment variables**), adicione:

   | Nome | Valor |
   |---|---|
   | DB_PASSWORD | A senha que VOCÊ criou para bradesco_app |
   | DB_USER | bradesco_app |
   | DB_URL | jdbc:postgresql://localhost:5432/bradesco_financiamentos |

   Insira uma variável por linha no editor. Não inclua aspas na senha. Não é a senha do administrador `postgres`, a menos que você tenha escolhido a mesma. Não compartilhe a configuração com senha no repositório.
8. Execute `FinanciamentosApplication`. Aguarde a mensagem **Started FinanciamentosApplication**. O backend ficará em `http://127.0.0.1:8080`.

O arquivo `pom.xml` já inclui Spring Boot, Spring Security, JPA, driver PostgreSQL, Flyway e testes. Você não precisa instalar Maven globalmente. O Wrapper também está incluído, mas para executá-lo fora do IntelliJ é necessário configurar JAVA_HOME para um JDK.

## 3. Frontend

Abra um terminal na pasta `frontend`, onde fica `package.json`. Execute:

```bat
npm ci
npm run dev
```

Seu Node.js 24 e npm instalados podem ser usados. Abra **http://127.0.0.1:5173** e mantenha esse terminal aberto. Use sempre esse mesmo endereço para preservar a sessão do navegador.

O Vite encaminha `/api` para o backend na porta 8080. O navegador não acessa o banco diretamente. Não precisa configurar senha no frontend. Não abra o HTML por duplo clique.

## 4. Teste rápido para a apresentação

1. Abra **Criar conta → Preencher dados de exemplo**. Os dados são fictícios; CPF tem dígitos verificadores válidos apenas para validação local, sem consulta cadastral. Use os exemplos somente neste projeto.
2. Verifique nascimento `20/05/1995`, renda `15000`, e-mail `mariana.duarte@email.com.br`, CPF `529.982.247-25` e senha `Bradesco#2026`. Cadastre uma única vez.
3. Entre com esse e-mail/CPF e a senha.
4. No cadastro de bens, use um bem de **R$ 12.500,00**, descreva-o e salve.
5. Na simulação: entrada **2500**, prazo **12**, taxa **1% ao mês**. Clique em **Calcular financiamento**.
6. Resultado esperado: financiado **R$ 10.000,00**, parcela padrão **R$ 888,49**, última **R$ 888,47**, juros **R$ 661,86**, total com entrada **R$ 13.161,86**.
7. Envie a proposta. Com os dados acima ela será aprovada. Mostre o protocolo e o cronograma.
8. Atualize a página: o login permanece durante a sessão e os bens/propostas são carregados do banco.
9. Volte à simulação, use entrada **0** e envie outra proposta. Ela será reprovada por financiar mais de 90% do bem.
10. Saia e entre novamente: as propostas continuam salvas. Se reiniciar o backend, faça login novamente; as contas e propostas permanecem no banco.

Se repetir o cadastro, o sistema informa que CPF/e-mail já existem. Nesse caso, entre com a conta anterior. Para testar outro cliente, use outros dados fictícios válidos. Nunca publique senhas reais em prints.

## Escopo e escolhas

- Taxa informada na tela agora é **mensal**, com rótulo explícito. O front antigo usava anual. Não digite uma taxa anual como se fosse mensal.
- Regra de idade preservada do código enviado: **18 anos ou mais**. O texto inicial do desafio dizia “mais de 18”; alinhem essa diferença com o responsável pelo backlog.
- Renda deve ser **estritamente maior** que 3 vezes a maior parcela prevista, incluindo ajuste da última. Financiamento máximo 90%; score mínimo 600.
- Score **700 demonstrativo**, atribuído pelo servidor a novos clientes, configurado em `app.score-demonstrativo`. Não existe consulta real a Serasa/Bradesco. Alterar a configuração afeta apenas novos cadastros.
- Nascimento e renda são informados pelo cliente; não há verificação documental.
- A proposta nasce EM_ANALISE e recebe a decisão dentro da mesma transação. A interface já recebe a decisão final; não há worker nem espera artificial. A decisão usa os dados salvos, não um status enviado pelo navegador.
- Uma simulação gera no máximo uma proposta. Reenvio sequencial retorna a mesma; requisições simultâneas são protegidas pela unicidade no banco e podem retornar 409.
- O cálculo usa BigDecimal, arredondamento em centavos e ajuste da última parcela. Não inclui IOF, tarifas, seguros ou CET. A taxa escolhida é somente para demonstração, sem representar oferta bancária.
- Contratos, cobrança de parcelas, pagamentos, inadimplência, recuperação de senha por e-mail e consulta externa de score não fazem parte desta entrega. Aprovação não gera contrato nesta versão.
- Cada execução local de um colega usa seu próprio PostgreSQL. Compartilhar o código no GitHub não compartilha os dados do banco.

## Como dividir com o squad

Versionem `backend/`, `frontend/`, os guias e `.gitignore`. Não enviem `node_modules`, `target`, `dist`, `.idea`, dados do banco ou senha. Cada colega cria seu banco e configura DB_PASSWORD localmente. Os scripts Flyway reproduzem a estrutura. Este pacote não foi enviado automaticamente aos repositórios do GitHub.

## Solução de problemas

| Sintoma | O que conferir |
|---|---|
| Password authentication failed | DB_PASSWORD é a senha do usuário bradesco_app; confira DB_USER. |
| Connection refused / porta 5432 | Serviço PostgreSQL iniciado e porta correta em DB_URL. |
| Database does not exist | Nome exato do banco em DB_URL. |
| Permission denied for schema public | O proprietário do banco deve ser bradesco_app. Confira em Properties do banco no pgAdmin. |
| Could not resolve placeholder DB_PASSWORD | Adicione a variável à configuração de execução no IntelliJ. |
| Porta 8080 ou 5173 ocupada | Pare outra execução da aplicação que esteja usando a porta. |
| Front não conecta | Backend iniciado sem erros; use o endereço 127.0.0.1:5173 indicado. |
| Projeto não reconhece Spring | Abra backend/pom.xml como projeto Maven e recarregue as dependências. |
| Banco com tabelas antigas / erro Flyway | Use um banco novo vazio para esta versão; não apague dados existentes sem backup. |

O serviço fica limitado à máquina local por padrão. Publicação externa exige configurar HTTPS, domínio, cookies seguros, limitação de tentativas de login, recuperação de acesso e gestão de segredos, além da revisão do ambiente.
