# Backend Geral - Consultor Financeiro Digital

API REST para consultor financeiro digital que centraliza e otimiza investimentos via Open Finance.

## Tecnologias

- **Node.js** com **Express 5**
- **PostgreSQL** (Neon Database)
- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **dotenv** para variáveis de ambiente
- Arquitetura **MVC**

## Pré-requisitos

- Node.js >= 16.0.0
- npm ou yarn
- Conta no [Neon](https://neon.tech) (PostgreSQL serverless)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/compass-estagio/backend-geral.git
cd backend-geral
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas credenciais:
```env
NODE_ENV=development
PORT=3000

# Database - Neon PostgreSQL
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@host/database?sslmode=require

# JWT Authentication
JWT_SECRET=sua-chave-secreta-super-segura-aqui
JWT_EXPIRES_IN=7d
```

5. Execute as migrations:
```bash
npm run migrate
```

6. Teste a conexão com o banco:
```bash
npm run db:test
```

## Executar o Projeto

### Desenvolvimento
```bash
npm run dev
```
O servidor estará disponível em `http://localhost:3000`

### Produção
```bash
npm start
```

## Endpoints Disponíveis

### Health Check
**GET** `/api/health`

Verifica o status da aplicação e conectividade com o banco de dados.

**Resposta de sucesso (200):**
```json
{
  "uptime": 136.51,
  "status": "OK",
  "timestamp": "2025-11-03T16:07:52.342Z",
  "environment": "development",
  "database": {
    "status": "connected",
    "timestamp": "2025-11-03T16:07:53.800Z",
    "version": "PostgreSQL 17.5",
    "tables": 4
  }
}
```

**Resposta de erro (503):**
```json
{
  "uptime": 45.23,
  "status": "ERROR",
  "timestamp": "2025-11-03T16:07:52.342Z",
  "environment": "production",
  "database": {
    "status": "disconnected",
    "error": "connection timeout"
  }
}
```

### Root
**GET** `/`

Endpoint raiz da aplicação.

**Resposta (200):**
```json
{
  "message": "Bem-vindo!",
  "status": "ok"
}
```

### Autenticação

#### Registro de Usuário
**POST** `/api/auth/register`

Cria um novo usuário no sistema. O CPF deve conter 11 dígitos (apenas números).

**Body:**
```json
{
  "cpf": "11144477735",
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Resposta de sucesso (201):**
```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": 1,
    "cpf": "11144477735",
    "name": "João Silva",
    "email": "joao@example.com",
    "created_at": "2025-11-03T20:02:25.216Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros possíveis:**
- `400` - CPF inválido, senha fraca ou campos obrigatórios faltando
- `409` - CPF ou email já cadastrado

#### Login
**POST** `/api/auth/login`

Realiza login com CPF e senha.

**Body:**
```json
{
  "cpf": "11144477735",
  "password": "senha123"
}
```

**Resposta de sucesso (200):**
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "cpf": "11144477735",
    "name": "João Silva",
    "email": "joao@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros possíveis:**
- `400` - Campos obrigatórios faltando
- `401` - CPF ou senha incorretos

#### Dados do Usuário Autenticado
**GET** `/api/auth/me`

Retorna os dados do usuário autenticado. **Requer autenticação JWT**.

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta de sucesso (200):**
```json
{
  "user": {
    "id": 1,
    "cpf": "11144477735",
    "name": "João Silva",
    "email": "joao@example.com",
    "created_at": "2025-11-03T20:02:25.216Z",
    "updated_at": "2025-11-03T20:02:25.216Z"
  }
}
```

**Erros possíveis:**
- `401` - Token não fornecido ou expirado
- `403` - Token inválido
- `404` - Usuário não encontrado

## Estrutura do Projeto

```
backend-geral/
├── src/
│   ├── config/           # Configurações da aplicação
│   │   └── index.js
│   ├── controllers/      # Controllers (lógica de negócio)
│   │   ├── authController.js
│   │   └── healthController.js
│   ├── database/         # Configuração do banco de dados
│   │   ├── db.js         # Pool de conexões
│   │   ├── migrate.js    # Sistema de migrations
│   │   └── migrations/   # Arquivos de migration
│   │       ├── V1__create_initial_schema.sql
│   │       └── V2__add_cpf_to_users.sql
│   ├── middlewares/      # Middlewares da aplicação
│   │   └── auth.js       # Autenticação JWT
│   ├── models/           # Models do banco de dados
│   │   └── User.js
│   ├── routes/           # Rotas da API
│   │   ├── authRoutes.js
│   │   └── index.js
│   └── server.js         # Ponto de entrada da aplicação
├── test-db-final.js      # Script de teste do banco
├── .env.example          # Exemplo de variáveis de ambiente
├── package.json
└── README.md
```

## Schema do Banco de Dados

### Tabela: users
```sql
id              SERIAL PRIMARY KEY
cpf             VARCHAR(11) UNIQUE
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
name            VARCHAR(255) NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
deleted_at      TIMESTAMP NULL
```

### Tabela: financial_accounts
```sql
id                  SERIAL PRIMARY KEY
user_id             INTEGER REFERENCES users(id) ON DELETE CASCADE
institution_name    VARCHAR(255) NOT NULL
account_type        VARCHAR(50) NOT NULL
balance             DECIMAL(15,2) DEFAULT 0.00
currency            VARCHAR(3) DEFAULT 'BRL'
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
deleted_at          TIMESTAMP NULL
```

### Tabela: transactions
```sql
id                  SERIAL PRIMARY KEY
account_id          INTEGER REFERENCES financial_accounts(id) ON DELETE CASCADE
amount              DECIMAL(15,2) NOT NULL
transaction_type    VARCHAR(20) NOT NULL
category            VARCHAR(100)
description         TEXT
transaction_date    TIMESTAMP NOT NULL
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o servidor em modo produção |
| `npm run dev` | Inicia o servidor em modo desenvolvimento com nodemon |
| `npm run migrate` | Executa migrations pendentes |
| `npm run migrate:info` | Exibe informações sobre migrations |
| `npm run db:test` | Testa a conexão com o banco de dados |

## Deploy na Vercel

O projeto está configurado para deploy automático na Vercel:

1. Conecte o repositório à Vercel
2. Configure as variáveis de ambiente no painel da Vercel:
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
   - `JWT_SECRET` (gere uma chave segura)
   - `JWT_EXPIRES_IN` (ex: 7d)
   - `NODE_ENV=production`
3. As migrations serão executadas automaticamente no build

### Verificar Deploy
Após o deploy, acesse:
```
https://seu-dominio.vercel.app/api/health
```

## Integrando com Frontend

### Base URL
```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
```

### Exemplo de requisição (fetch)
```javascript
// Health check
const response = await fetch(`${API_BASE_URL}/api/health`);
const data = await response.json();

if (data.status === 'OK') {
  console.log('API está funcionando!');
}
```

### Exemplo de requisição (axios)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
const { data } = await api.get('/health');
```

### Autenticação no Frontend

```javascript
// Login
const login = async (cpf, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf, password }),
  });

  const data = await response.json();

  if (response.ok) {
    // Salvar token (localStorage, cookie, etc)
    localStorage.setItem('token', data.token);
    return data.user;
  }

  throw new Error(data.message);
};

// Requisição autenticada
const getUserData = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return await response.json();
};
```

### CORS
Para adicionar o domínio do seu frontend, configure a variável de ambiente:
```env
ALLOWED_ORIGINS=https://seu-frontend.vercel.app
```

## Troubleshooting

### Erro de conexão com o banco
1. Verifique se as credenciais no `.env` estão corretas
2. Execute `npm run db:test` para testar a conexão
3. Certifique-se de que o Neon permite conexões externas

### Migrations não aplicadas
```bash
npm run migrate:info  # Ver status das migrations
npm run migrate       # Aplicar migrations pendentes
```

### Porta já em uso
Altere a porta no arquivo `.env`:
```env
PORT=3001
```

## Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feat/nova-feature`
2. Commit suas mudanças: `git commit -m 'feat: adiciona nova feature'`
3. Push para a branch: `git push origin feat/nova-feature`
4. Abra um Pull Request

### Padrão de Commits
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `chore:` Tarefas gerais
- `refactor:` Refatoração de código

## Licença

UNLICENSED - Uso interno Compass Estágio

## Contato

- **Repositório:** [compass-estagio/backend-geral](https://github.com/compass-estagio/backend-geral)
- **Issues:** [Reportar problemas](https://github.com/compass-estagio/backend-geral/issues)
