# Neon Database Branching - Guia Completo

## O que é Database Branching?

O Neon PostgreSQL permite criar **branches do banco de dados**, similar ao Git para código. Cada branch é uma cópia isolada do banco que pode ser modificada independentemente.

## Conceitos

### Branch Principal (main)
- Banco de **produção**
- Dados reais dos usuários
- Apenas código testado e aprovado

### Branch de Staging (homolog)
- Cópia do banco de produção
- Usado para testar migrations e features
- Dados reais mas isolados

### Feature Branches
- Branches temporários para desenvolvimento
- Criados a partir de main ou homolog
- Deletados após merge

## Como Criar Branches no Neon

### 1. Via Neon Console (Interface Web)

**Acesse:** https://console.neon.tech

```
1. Selecione seu projeto
2. Clique em "Branches" no menu lateral
3. Clique em "Create Branch"
4. Preencha:
   - Name: homolog
   - Parent: main
   - Type: Development
5. Clique em "Create Branch"
```

### 2. Via Neon CLI

**Instalar:**
```bash
npm install -g neonctl
```

**Autenticar:**
```bash
neonctl auth
```

**Criar branch de homolog:**
```bash
neonctl branches create --name homolog --parent main
```

**Listar branches:**
```bash
neonctl branches list
```

**Deletar branch:**
```bash
neonctl branches delete homolog
```

### 3. Via API do Neon

```bash
curl -X POST \
  'https://console.neon.tech/api/v2/projects/YOUR_PROJECT_ID/branches' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "branch": {
      "name": "homolog",
      "parent_id": "main"
    }
  }'
```

## Obter Connection Strings por Branch

Depois de criar a branch, você terá **URLs diferentes** para cada branch:

### Branch main (Production)
```
# Pooled
postgresql://user:pass@ep-main-pooler.region.aws.neon.tech/neondb?sslmode=require

# Unpooled
postgresql://user:pass@ep-main.region.aws.neon.tech/neondb?sslmode=require
```

### Branch homolog (Staging)
```
# Pooled
postgresql://user:pass@ep-homolog-pooler.region.aws.neon.tech/neondb?sslmode=require

# Unpooled
postgresql://user:pass@ep-homolog.region.aws.neon.tech/neondb?sslmode=require
```

**Onde encontrar:**
```
Neon Console → Seu Projeto → Branches → Selecione a branch → Connection Details
```

## Integração com Vercel

### Configuração de Environment Variables

#### Production (branch main do Git → branch main do Neon)

```
Vercel → Settings → Environment Variables

DATABASE_URL
Value: postgresql://user:pass@ep-main-pooler...
Environments: ☑ Production

DATABASE_URL_UNPOOLED
Value: postgresql://user:pass@ep-main...
Environments: ☑ Production
```

#### Preview/Staging (branch homolog do Git → branch homolog do Neon)

```
DATABASE_URL
Value: postgresql://user:pass@ep-homolog-pooler...
Environments: ☑ Preview

DATABASE_URL_UNPOOLED
Value: postgresql://user:pass@ep-homolog...
Environments: ☑ Preview
```

## Workflow Completo

### 1. Setup Inicial

```bash
# 1. Criar branch no Neon
neonctl branches create --name homolog --parent main

# 2. Copiar connection strings
neonctl connection-string homolog

# 3. Adicionar na Vercel (Environment Variables)
# DATABASE_URL = <url da branch homolog> (Preview)
```

### 2. Fluxo de Desenvolvimento

```
Developer
    ↓
Cria feature branch no Git
    ↓
Develop & test localmente
    ↓
Abre PR para main
    ↓
Code Review aprovado
    ↓
Merge para main (Git)
    ↓
GitHub Actions sincroniza main → homolog (Git)
    ↓
Deploy automático na Vercel
    ├─ main (Git) → usa main branch (Neon) → Production
    └─ homolog (Git) → usa homolog branch (Neon) → Staging
```

### 3. Testar Migrations em Staging

```bash
# 1. Criar nova migration localmente
npm run migrate:create add_new_column

# 2. Testar em homolog
# Fazer push para branch homolog
git checkout homolog
git merge main
git push origin homolog

# 3. Vercel deploys automaticamente
# Migration roda no banco homolog (Neon)

# 4. Verificar
curl https://seu-app-git-homolog.vercel.app/api/health

# 5. Se OK, fazer merge para main
# Migration roda no banco main (Neon)
```

## Sincronizar Dados de Produção para Homolog

### Opção 1: Recriar Branch (Recomendado)

**Deleta e recria** a branch homolog com dados frescos de produção:

```bash
# 1. Deletar branch antiga
neonctl branches delete homolog --force

# 2. Criar nova branch a partir de main (pega dados atuais)
neonctl branches create --name homolog --parent main
```

⚠️ **Isso apaga todas as mudanças em homolog!**

### Opção 2: Reset da Branch

Via Neon Console:
```
Branches → homolog → Actions → Reset from main
```

### Opção 3: Dump & Restore

```bash
# Export de produção
pg_dump $DATABASE_URL_PROD > prod_dump.sql

# Import para homolog
psql $DATABASE_URL_HOMOLOG < prod_dump.sql
```

## Gerenciando Branches

### Listar todas as branches

**Via CLI:**
```bash
neonctl branches list
```

**Via Console:**
```
Neon Console → Branches
```

### Informações de uma branch

```bash
neonctl branches get homolog
```

### Deletar branch antiga

```bash
neonctl branches delete old-feature-branch
```

## Custos

O Neon usa **copy-on-write**:

- Branch inicial: ~0 MB (aponta para dados do parent)
- Após mudanças: apenas o diferencial é armazenado
- **Muito econômico** para staging/homolog

### Exemplo de uso:

```
main (production): 10 GB de dados
homolog (branch):  0 GB inicial → 500 MB após testes
Custo adicional:   Apenas 500 MB
```

## Monitoramento

### Ver tamanho de cada branch:

```bash
neonctl branches list --show-size
```

### Ver queries ativas:

```bash
# Conecte ao banco e execute:
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

## Troubleshooting

### Branch não aparece na Vercel

1. Verifique se adicionou a connection string correta
2. Force um novo deploy:
   ```bash
   git commit --allow-empty -m "chore: trigger deploy"
   git push
   ```

### Migrations não rodam em homolog

1. Verifique se `DATABASE_URL_UNPOOLED` está configurada para Preview
2. Verifique logs do Vercel build

### Dados desatualizados em homolog

1. Recrie a branch:
   ```bash
   neonctl branches delete homolog --force
   neonctl branches create --name homolog --parent main
   ```

2. Atualize a connection string na Vercel (se mudou)

## Boas Práticas

### ✅ DO

- Crie branch homolog a partir de main
- Use homolog para testar migrations
- Recrie homolog periodicamente para ter dados frescos
- Delete feature branches após merge
- Use branches descritivas: `feat/auth`, `fix/bug-123`

### ❌ DON'T

- Não coloque dados sensíveis em homolog sem criptografia
- Não use homolog para desenvolvimento local (use branch local)
- Não mantenha muitas branches antigas (custo)
- Não teste em produção (sempre teste em homolog primeiro)

## Automação - GitHub Actions

### Auto-criar branch Neon para cada PR (Avançado)

```yaml
name: Create Neon Branch for PR

on:
  pull_request:
    types: [opened]

jobs:
  create-neon-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Create Neon Branch
        env:
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
        run: |
          BRANCH_NAME="pr-${{ github.event.pull_request.number }}"
          neonctl branches create --name $BRANCH_NAME --parent main
```

## Recursos Adicionais

- **Neon Docs:** https://neon.tech/docs/guides/branching
- **Neon CLI:** https://neon.tech/docs/reference/neon-cli
- **Neon API:** https://neon.tech/docs/reference/api-reference

## Exemplo Prático - Setup Completo

```bash
# 1. Criar branch homolog no Neon
neonctl branches create --name homolog --parent main

# 2. Obter connection strings
neonctl connection-string homolog --pooled
neonctl connection-string homolog --unpooled

# 3. Adicionar na Vercel
# (via interface ou CLI)
vercel env add DATABASE_URL preview
# Cole a URL pooled de homolog

vercel env add DATABASE_URL_UNPOOLED preview
# Cole a URL unpooled de homolog

# 4. Deploy
git push origin homolog

# 5. Verificar
curl https://seu-app-git-homolog.vercel.app/api/health
```

## Segurança

### Proteção de Connection Strings

- ✅ Sempre use variáveis de ambiente (nunca commite)
- ✅ Use secrets do GitHub para CI/CD
- ✅ Rotacione passwords regularmente
- ✅ Use SSL mode (sslmode=require)

### Acesso

- Configure usuários diferentes para prod/homolog
- Use roles do PostgreSQL para limitar permissões
- Audit logs estão disponíveis no Neon Console
