## Documentação da API EficazEmail

## Índice
1. [Introdução](#introdução)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Executando a Aplicação](#executando)
6. [Endpoints](#endpoints)
    - [Endpoints de Autenticação](#autenticação)
    - [Endpoints de Email](#emails)
    - [Endpoints de Pagamento](#pagamentos)
    - [Endpoints de CSRF](#csrf)
7. [Middlewares](#middlewares)
8. [Serviços](#serviços)
9. [Tratamento de Erros](#tratamento-de-erros)

## Introdução
EficazEmail é uma API de encaminhamento de emails e processamento de pagamentos construída com Node.js, Express.js e MongoDB. Esta documentação fornece informações detalhadas sobre a estrutura do projeto, instalação, configuração, endpoints e uso.

### Principais Funcionalidades:
- **Encaminhamento de Emails**: Criação e gestão de endereços de email de encaminhamento dentro de um domínio específico.
- **Processamento de Pagamentos**: Manipulação da criação de pagamentos e atualizações de status usando PIX.
- **Autenticação de Usuários**: Login seguro e gerenciamento de tokens com JWT.
- **Capacidades Administrativas**: Rotas e permissões especiais para tarefas administrativas.
- **Proteção contra CSRF**: Garantia de segurança com tokens CSRF.
- **Limitação de Taxa**: Proteção de endpoints com limitação de taxa para evitar abusos.

### Tecnologias Utilizadas:
- **Node.js**: Ambiente de execução JavaScript.
- **Express.js**: Framework web para Node.js.
- **MongoDB**: Banco de dados NoSQL.
- **JWT**: JSON Web Tokens para autenticação segura de usuários.
- **Axios**: Cliente HTTP baseado em promessas para fazer requisições.
- **Socket.io**: Comunicação em tempo real para manipulação de atualizações de status de pagamento.
- **Helmet**: Middleware de segurança para Express.js.
- **CSRF**: Middleware para proteção contra CSRF.
- **Winston**: Biblioteca de logging.
- **Migrate-mongo**: Ferramenta de migração de banco de dados.
- **bcrypt**: Biblioteca para hash de senhas.
- **Nodemailer**: Módulo para envio de emails.
- **express-validator**: Middleware para validação de requisições.

### Estrutura do Projeto
```sh
backend/
├── migrations/
│   └── 20240514120000-eficazemail1.js
├── src/
│   ├── config/
│   │   └── database.js
│   ├── enums/
│   │   ├── dominio.js
│   │   └── plano.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── csrfRoutes.js
│   │   ├── emailRoutes.js
│   │   └── paymentRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── emailController.js
│   │   └── paymentController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── emailServices/
│   │   │   ├── cancelarEncaminhamento.js
│   │   │   ├── criarEmail.js
│   │   │   ├── direcionarEmail.js
│   │   │   └── index.js
│   │   ├── passwordService.js
│   │   ├── paymentService.js
│   │   ├── tokenService.js
│   │   ├── tempTokenService.js
│   │   └── pegarToken.js
│   ├── models/
│   │   ├── User.js
│   │   └── Payment.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── validateRequest.js
│   │   ├── verifyUserEmail.js
│   │   └── isAdmin.js
│   └── utils/
│       └── logger.js
├── package.json
├── index.js
├── migrate-mongo-config.js
├── .env
└── socket.js

```


## Instalação
Para instalar e executar o projeto, siga estes passos::

1. **Clone o repositório**:


2. **Instale as dependências**:
    ```sh
    npm install
    ```

3. **Configuração das variáveis de ambiente**:
    Crie um arquivo `.env` no diretório raiz e adicione as variáveis de ambiente necessárias conforme mostrado no exemplo `.env` fornecido.

## Configuração
### Variáveis de Ambiente

Para configurar corretamente o projeto, você precisará definir as seguintes variáveis de ambiente no seu arquivo `.env`:

- **`DOMINIO_EMAIL`**: Define o domínio padrão para os endereços de email criados.
  

- **`URL_SERVER_EMAIL`**: URL do servidor de email utilizado para gerenciar os encaminhamentos de email.
  

- **`SERVER_USERNAME`**: Nome de usuário para autenticação no servidor de email.
  

- **`SERVER_PASSWORD`**: Senha para autenticação no servidor de email.
  

- **`SENHA_PADRAO`**: Senha padrão utilizada ao criar novos usuários de email.
  

- **`MONGODB_URI`**: URI de conexão para o servidor MongoDB, incluindo credenciais e informações de conexão.
  

- **`DB_NAME`**: Nome do banco de dados MongoDB a ser utilizado.
  
- **`EMAIL_HOST`**: Endereço do servidor de email usado para enviar emails.
  

- **`EMAIL_PORT`**: Porta usada para conectar ao servidor de email.
  

- **`EMAIL_SECURE`**: Indica se a conexão com o servidor de email deve usar SSL/TLS (true ou false).
  
- **`EMAIL_USER`**: Nome de usuário para autenticação no servidor de email.
  

- **`EMAIL_PASS`**: Senha para autenticação no servidor de email.
  
- **`EMAIL_FROM`**: Endereço de email padrão utilizado como remetente.
  

- **`PIX_API_URL`**: URL base da API do PIX para processamento de pagamentos (OpenPix).
  

- **`PIX_API_KEY`**: Chave de API para autenticação e autorização no serviço PIX (OpenPix).
  

- **`ALLOWED_ORIGINS`**: Lista de origens permitidas para CORS, separadas por vírgulas.
  

- **`JWT_SECRET`**: Chave secreta para geração de tokens JWT.
  

- **`JWT_REFRESH_SECRET`**: Chave secreta para geração de tokens de refresh JWT.
  

- **`NODE_ENV`**: Define o ambiente de execução da aplicação (desenvolvimento ou produção).
  



## executando
### Modo de Desenvolvimento
```sh
npm run dev
```
### Modo de Produção
```sh
npm start
```

# Endpoints


### Autenticação

- **POST /api/auth/sendPassword**
  - **Descrição**: Envia uma nova senha temporária para o email fornecido.
  - **Corpo da requisição**: 
    ```json
    { "email": "usuario@exemplo.com" }
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 200, "status": "success", "message": "Senha enviada para o e-mail." }
    ```
  - **Resposta de erro**: 
    ```json
    { "code": 404, "status": "error", "message": "User not found" }
    ```

- **POST /api/auth/login**
  - **Descrição**: Realiza o login com email e senha, retornando um token de acesso.
  - **Corpo da requisição**: 
    ```json
    { "email": "usuario@exemplo.com", "password": "senha123" }
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 200, "status": "success", "message": "Login bem-sucedido.", "token": "token_acesso" }
    ```
  - **Resposta de erro**: 
    ```json
    { "code": 400, "status": "error", "message": "Senha inválida." }
    ```

- **POST /api/auth/refreshToken**
  - **Descrição**: Renova o token de acesso com o refresh token fornecido.
  - **Corpo da requisição**: 
    ```json
    { "refreshToken": "token_refresh" }
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 200, "status": "success", "token": "novo_token_acesso" }
    ```
  - **Resposta de erro**: 
    ```json
    { "code": 403, "status": "error", "message": "Erro ao renovar os tokens.", "data": "Refresh token inválido." }
    ```

- **POST /api/auth/logout**
  - **Descrição**: Realiza o logout do usuário, invalidando o refresh token.
  - **Cabeçalho**: 
    ```http
    Authorization: Bearer token_acesso
    ```
  - **Resposta de sucesso**: 
    ```json
    { "message": "Logout bem-sucedido." }
    ```
  - **Resposta de erro**: 
    ```json
    { "code": 500, "status": "error", "message": "Erro ao realizar logout.", "data": "erro_message" }
    ```


### Emails

- **GET /api/emails/bemvindo**
  - **Descrição**: Endpoint de boas-vindas.
  - **Resposta**: 
    ```json
    { "code": 200, "status": "success", "message": "Bem vindo a API de email" }
    ```

- **POST /api/emails/criaremail**
  - **Descrição**: Cria um novo email no domínio eficaz.email.
  - **Corpo da requisição**: 
    ```json
    { "userEmail": "usuario@exemplo.com", "customName": "nome_personalizado", "name": "Nome do Usuário", "senha": "senha123" }
    ```
  - **Cabeçalho**: 
    ```http
    Authorization: Bearer token_acesso
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 200, "status": "success", "message": "Email criado com sucesso", "email": "nome_personalizado@eficaz.email", "data": "dados_do_email" }
    ```
  - **Respostas de erro**: 
    ```json
    { "code": 400, "status": "error", "message": "Não é permitido criar e-mails com o domínio eficaz.email." }
    ```
    ```json
    { "code": 400, "status": "error", "message": "E-mail já existe. Por favor, escolha outro nome." }
    ```
    ```json
    { "code": 403, "status": "error", "message": "Plano gratuito permite até 3 e-mails." }
    ```

- **POST /api/emails/direcionaremail**
  - **Descrição**: Configura o encaminhamento de um email para outro endereço.
  - **Corpo da requisição**: 
    ```json
    { "userEmail": "usuario@exemplo.com", "customName": "nome_personalizado@eficaz.email" }
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 200, "status": "success", "message": "E-mail direcionado com sucesso.", "data": { "address": "nome_personalizado@eficaz.email" } }
    ```
  - **Respostas de erro**: 
    ```json
    { "code": 400, "status": "error", "message": "Os campos userEmail e customName são obrigatórios." }
    ```
    ```json
    { "code": 400, "status": "error", "message": "E-mail já está registrado em outro usuário." }
    ```
    ```json
    { "code": 403, "status": "error", "message": "Plano gratuito permite até 3 e-mails." }
    ```

- **POST /api/emails/cancelarencaminhamento**
  - **Descrição**: Cancela o encaminhamento de um email.
  - **Corpo da requisição**: 
    ```json
    { "userEmail": "usuario@exemplo.com", "clientEmail": "nome_personalizado@eficaz.email" }
    ```
  - **Cabeçalho**: 
    ```http
    Authorization: Bearer token_acesso
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 200, "status": "success", "message": "Encaminhamento cancelado com sucesso." }
    ```
  - **Resposta de erro**: 
    ```json
    { "code": 404, "status": "error", "message": "E-mail não encontrado." }
    ```

- **POST /api/emails/atualizarencaminhamento**
  - **Descrição**: Atualiza o endereço de encaminhamento de um email.
  - **Corpo da requisição**: 
    ```json
    { "userEmail": "usuario@exemplo.com", "clientEmail": "nome_personalizado@eficaz.email", "forwardingEmail": "novo_encaminhamento@exemplo.com" }
    ```
  - **Cabeçalho**: 
    ```http
    Authorization: Bearer token_acesso
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 200, "status": "success", "message": "Encaminhamento atualizado com sucesso." }
    ```
  - **Respostas de erro**: 
    ```json
    { "code": 404, "status": "error", "message": "Usuário não encontrado." }
    ```
    ```json
    { "code": 404, "status": "error", "message": "E-mail não encontrado ou não está vinculado ao usuário." }
    ```

- **POST /api/emails/reativarencaminhamento**
  - **Descrição**: Reativa o encaminhamento de um email.
  - **Corpo da requisição**: 
    ```json
    { "userEmail": "usuario@exemplo.com", "clientEmail": "nome_personalizado@eficaz.email" }
    ```
  - **Cabeçalho**: 
    ```http
    Authorization: Bearer token_acesso
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 200, "status": "success", "message": "Encaminhamento reativado com sucesso." }
    ```
  - **Resposta de erro**: 
    ```json
    { "code": 404, "status": "error", "message": "E-mail não encontrado ou já está ativo." }
    ```

- **GET /api/emails/listarusuarios** (Somente administradores)
  - **Descrição**: Lista todos os usuários.
  - **Cabeçalho**: 
    ```http
    Authorization: Bearer token_acesso
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 200, "status": "success", "data": [{ "name": "Nome do Usuário", "email": "usuario@exemplo.com", "plan": "free", "paymentDate": "2023-05-20T12:00:00.000Z" }, ...] }
    ```

- **POST /api/emails/atualizarplano** (Somente administradores)
  - **Descrição**: Atualiza o plano de um usuário.
  - **Corpo da requisição**: 
    ```json
    { "userId": "id_usuario", "novoPlano": "paid" }
    ```
  - **Cabeçalho**: 
    ```http
    Authorization: Bearer token_acesso
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 200, "status": "success", "message": "Plano atualizado com sucesso" }
    ```


### Pagamentos

- **POST /api/payments/create-guest**
  - **Descrição**: Cria um pagamento para um usuário convidado.
  - **Corpo da requisição**: 
    ```json
    { "name": "Nome do Usuário", "email": "usuario@exemplo.com", "cpf": "12345678901", "phone": "5551999887766" }
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 201, "status": "success", "message": "Payment created successfully", "data": { "transactionID": "transaction ID here", "paymentLink": "payment link here", "pixCode": "pix code here" } }
    ```

- **POST /api/payments/create-auth**
  - **Descrição**: Cria um pagamento para um usuário autenticado.
  - **Corpo da requisição**: 
    ```json
    { "cpf": "12345678901", "phone": "5551999887766" }
    ```
  - **Cabeçalho**: 
    ```http
    Authorization: Bearer token_acesso
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 201, "status": "success", "message": "Payment created successfully", "data": { "transactionID": "transaction ID here", "paymentLink": "payment link here", "pixCode": "pix code here" } }
    ```

- **POST /api/payments/webhook**
  - **Descrição**: Lida com eventos de webhook do provedor de pagamento.
  - **Corpo da requisição**: 
    ```json
    { "event": "event name here", "charge": { "transactionID": "transaction ID here", "status": "completed" } }
    ```
  - **Resposta de sucesso**: 
    ```json
    { "code": 200, "status": "success", "message": "Webhook recebido com sucesso" }
    ```

- **POST /api/payments/startPayment**
  - **Descrição**: Inicia uma sessão de pagamento e retorna um token temporário.
  - **Corpo da requisição**: 
    ```json
    { "transactionID": "transaction ID here" }
    ```
  - **Resposta de sucesso**: 
    ```json
    { "tempToken": "temporary token here" }
    ```

### CSRF

- **GET /api/csrf/get-csrf-token**
  - **Descrição**: Recupera um token CSRF.
  - **Resposta de sucesso**: 
    ```json
    { "csrfToken": "csrf token here" }
    ```
