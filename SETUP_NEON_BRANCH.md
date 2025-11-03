# Setup: Criar Branch Homolog no Neon

> **Nota:** O Neon CLI requer Node.js >= 20. Como você tem Node 18.16.1,
> vamos usar a interface web que é mais simples e visual.

## 🌳 Passo a Passo - Criar Branch no Neon Console

### 1. Acessar Neon Console

Abra seu navegador em: **https://console.neon.tech**

Faça login com sua conta.

### 2. Selecionar Projeto

Clique no projeto **backend-geral** (ou como você nomeou).

### 3. Ir para Branches

No menu lateral esquerdo, clique em **"Branches"**.

Você verá a branch **main** existente.

### 4. Criar Nova Branch

Clique no botão **"New Branch"** (no canto superior direito).

Preencha o formulário:

```
┌────────────────────────────────────────────┐
│ Create a new branch                        │
├────────────────────────────────────────────┤
│ Branch name:                               │
│ ┌────────────────────────────────────┐    │
│ │ homolog                            │    │
│ └────────────────────────────────────┘    │
│                                            │
│ Parent branch:                             │
│ ┌────────────────────────────────────┐    │
│ │ main                         ▼     │    │
│ └────────────────────────────────────┘    │
│                                            │
│ Branch type:                               │
│ ○ Production                               │
│ ● Development  ← SELECIONE ESTE            │
│                                            │
│ [Cancel]  [Create Branch]                  │
└────────────────────────────────────────────┘
```

- **Branch name:** `homolog`
- **Parent branch:** `main`
- **Branch type:** `Development`

### 5. Clique em "Create Branch"

Aguarde alguns segundos. O Neon vai criar uma cópia completa do banco de dados main.

### 6. Obter Connection Strings

Após criar, você será redirecionado para a página da branch **homolog**.

Procure pela seção **"Connection Details"** ou **"Connection String"**.

Você verá **duas URLs**:

#### A. Pooled Connection (para aplicação)
```
postgresql://neondb_owner:npg_xxxxx@ep-homolog-xxxxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

**Copie essa URL** e salve como `DATABASE_URL` (Preview) na Vercel.

#### B. Unpooled Connection (para migrations)
```
postgresql://neondb_owner:npg_xxxxx@ep-homolog-xxxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

**Copie essa URL** e salve como `DATABASE_URL_UNPOOLED` (Preview) na Vercel.

---

## ⚙️ Configurar na Vercel

Agora que você tem as connection strings da branch **homolog**:

### 1. Abrir Vercel

```
https://vercel.com/seu-usuario/seu-projeto/settings/environment-variables
```

### 2. Adicionar DATABASE_URL (Preview)

Clique em **"Add New"**:

```
Name: DATABASE_URL
Value: [Cole a URL POOLED da branch homolog aqui]
Environments:
  ☐ Production
  ☑ Preview        ← MARQUE APENAS ESTE
  ☐ Development
```

Clique **"Save"**.

### 3. Adicionar DATABASE_URL_UNPOOLED (Preview)

Clique em **"Add New"** novamente:

```
Name: DATABASE_URL_UNPOOLED
Value: [Cole a URL UNPOOLED da branch homolog aqui]
Environments:
  ☐ Production
  ☑ Preview        ← MARQUE APENAS ESTE
  ☐ Development
```

Clique **"Save"**.

### 4. Verificar Variáveis de Produção

Certifique-se de que você TEM variáveis para **Production** também:

```
DATABASE_URL (Production)
Value: [URL do banco main - produção]
Environment: ☑ Production

DATABASE_URL_UNPOOLED (Production)
Value: [URL unpooled do banco main]
Environment: ☑ Production
```

Se não tiver, adicione também!

---

## 🚀 Fazer Redeploy

Agora force um novo deploy para aplicar as variáveis:

```bash
git checkout homolog
git commit --allow-empty -m "chore: trigger deploy with new db branch"
git push origin homolog
```

Aguarde o deploy terminar na Vercel.

---

## ✅ Verificar se Funcionou

Teste o endpoint de health:

```bash
curl https://seu-projeto-git-homolog.vercel.app/api/health
```

Você deve ver algo como:

```json
{
  "environment": {
    "NODE_ENV": "staging",
    "VERCEL_ENV": "preview",
    "VERCEL_GIT_COMMIT_REF": "homolog"
  },
  "database_config": {
    "host": "ep-homolog-xxxxx-pooler.sa-east-1.aws.neon.tech",
    "database": "neondb"
  },
  "database": {
    "status": "connected",
    "database_name": "neondb"
  }
}
```

**Confirme:**
- ✅ `VERCEL_ENV` = `"preview"`
- ✅ `database_config.host` contém `"homolog"` ou é diferente do host de produção
- ✅ `database.status` = `"connected"`

---

## 🎉 Pronto!

Agora você tem:

- ✅ Branch **main** no Neon → Para produção
- ✅ Branch **homolog** no Neon → Para staging/testes
- ✅ Cada deploy usa o banco correto automaticamente
- ✅ Dados isolados entre ambientes

---

## 📊 Visualização

```
Git Repository         Neon Database         Vercel Deploy
─────────────────────────────────────────────────────────
main (branch)    →    main (db branch)  →   Production
                      (dados reais)          seu-app.vercel.app

homolog (branch) →    homolog (db branch) → Preview/Staging
                      (cópia de dados)       seu-app-git-homolog.vercel.app
```

---

## 🔄 Atualizar Homolog com Dados de Produção

Quando quiser sincronizar homolog com dados frescos de produção:

### Via Console:
```
Neon Console → Branches → homolog → Actions → Reset from parent
```

### Via CLI (quando atualizar Node):
```bash
neonctl branches delete homolog --force
neonctl branches create --name homolog --parent main
# Não esqueça de atualizar as connection strings na Vercel!
```

---

## ❓ Troubleshooting

### Não vejo opção "Branches" no Neon Console

- Certifique-se de estar no plano que suporta branching
- Free tier do Neon suporta até 10 branches!

### Connection string não funciona

- Verifique se copiou a URL completa (incluindo senha)
- Confirme que tem `?sslmode=require` no final
- Teste localmente primeiro: `psql "<connection-string>"`

### Vercel ainda usa banco de produção em preview

1. Verifique se marcou **Preview** (não Production) ao adicionar variável
2. Force um novo deploy
3. Verifique nos logs se a variável está sendo usada
