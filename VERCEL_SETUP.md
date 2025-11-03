# Configuração de Variáveis de Ambiente na Vercel

## Como o Vercel Diferencia Ambientes

O Vercel automaticamente seleciona as variáveis corretas baseado em:

### 1. Branch
- `main` → Production
- `homolog` → Preview
- Outras branches → Preview

### 2. Environment Scope
Cada variável pode ter valores diferentes para:
- **Production** (main)
- **Preview** (homolog + outras branches)
- **Development** (local)

## Passo a Passo - Configuração

### 1. Acessar Environment Variables

```
Vercel Dashboard → Seu Projeto → Settings → Environment Variables
```

### 2. Adicionar Variáveis de PRODUÇÃO

Clique em **"Add New"** e configure:

**DATABASE_URL (Produção)**
```
Name: DATABASE_URL
Value: postgresql://prod-user:prod-pass@prod-host/prod-db?sslmode=require
Environments:
  ☑ Production
  ☐ Preview
  ☐ Development
```

**DATABASE_URL_UNPOOLED (Produção)**
```
Name: DATABASE_URL_UNPOOLED
Value: postgresql://prod-user:prod-pass@prod-host/prod-db?sslmode=require
Environments:
  ☑ Production
  ☐ Preview
  ☐ Development
```

**JWT_SECRET (Produção)**
```
Name: JWT_SECRET
Value: super-secret-production-key-change-this-12345
Environments:
  ☑ Production
  ☐ Preview
  ☐ Development
```

**NODE_ENV (Produção)**
```
Name: NODE_ENV
Value: production
Environments:
  ☑ Production
  ☐ Preview
  ☐ Development
```

### 3. Adicionar Variáveis de HOMOLOG/STAGING

**DATABASE_URL (Homolog)**
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_Cq4AzYDNIB0m@ep-aged-river-acrla81j-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
Environments:
  ☐ Production
  ☑ Preview
  ☐ Development
```

**DATABASE_URL_UNPOOLED (Homolog)**
```
Name: DATABASE_URL_UNPOOLED
Value: postgresql://neondb_owner:npg_Cq4AzYDNIB0m@ep-aged-river-acrla81j.sa-east-1.aws.neon.tech/neondb?sslmode=require
Environments:
  ☐ Production
  ☑ Preview
  ☐ Development
```

**JWT_SECRET (Homolog)**
```
Name: JWT_SECRET
Value: homolog-secret-key-different-from-prod
Environments:
  ☐ Production
  ☑ Preview
  ☐ Development
```

**NODE_ENV (Homolog)**
```
Name: NODE_ENV
Value: staging
Environments:
  ☐ Production
  ☑ Preview
  ☐ Development
```

## Como o Vercel Seleciona a Variável

### Branch `main` (Production):
```javascript
// O Vercel automaticamente injeta:
process.env.DATABASE_URL = "postgresql://prod-user:..."
process.env.NODE_ENV = "production"
```

### Branch `homolog` (Preview):
```javascript
// O Vercel automaticamente injeta:
process.env.DATABASE_URL = "postgresql://neondb_owner:..."
process.env.NODE_ENV = "staging"
```

## Detectar Ambiente no Código

Você pode usar variáveis do Vercel para detectar o ambiente:

```javascript
// src/config/index.js
const isProduction = process.env.VERCEL_ENV === 'production';
const isPreview = process.env.VERCEL_ENV === 'preview';
const isDevelopment = process.env.VERCEL_ENV === 'development';

console.log('Ambiente:', process.env.VERCEL_ENV);
console.log('Branch:', process.env.VERCEL_GIT_COMMIT_REF);
```

### Variáveis Automáticas do Vercel:

| Variável | Produção | Preview | Local |
|----------|----------|---------|-------|
| `VERCEL_ENV` | `production` | `preview` | `development` |
| `VERCEL_URL` | `seu-projeto.vercel.app` | `seu-projeto-git-homolog.vercel.app` | `localhost:3000` |
| `VERCEL_GIT_COMMIT_REF` | `main` | `homolog` | - |

## Verificar Configuração

### 1. Após configurar, faça um deploy:

```bash
git checkout homolog
git push origin homolog
```

### 2. Verifique os logs do build:

```
Vercel Dashboard → Deployments → Selecione o deploy → View Logs
```

Procure por:
```
Build env:
  DATABASE_URL: postgresql://neondb_owner:...
  NODE_ENV: staging
```

### 3. Teste o endpoint:

```bash
curl https://seu-projeto-git-homolog.vercel.app/api/health
```

Deve retornar:
```json
{
  "environment": "staging",
  "database": {
    "status": "connected"
  }
}
```

## Diferença entre Production e Preview

| Aspecto | Production (main) | Preview (homolog) |
|---------|-------------------|-------------------|
| URL | `seu-projeto.vercel.app` | `seu-projeto-git-homolog.vercel.app` |
| Banco | Produção | Homologação |
| JWT_SECRET | Secret forte | Secret diferente |
| NODE_ENV | `production` | `staging` |
| VERCEL_ENV | `production` | `preview` |

## Troubleshooting

### Variável não está sendo aplicada

1. Verifique se marcou o environment correto (Production/Preview)
2. Faça um novo deploy (não é automático para variáveis já existentes)
3. Verifique nos logs do build se a variável aparece

### Como forçar novo deploy

```bash
# Trigger deploy sem mudanças
git commit --allow-empty -m "chore: trigger deploy"
git push origin homolog
```

### Verificar qual variável está ativa

Adicione temporariamente ao código:
```javascript
console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
```

## Segurança

⚠️ **NUNCA:**
- Commite variáveis de produção no código
- Use o mesmo JWT_SECRET em prod e homolog
- Use o mesmo banco em prod e homolog

✅ **SEMPRE:**
- Use secrets fortes e únicos para produção
- Mantenha bancos separados
- Revise variáveis antes de promover para produção
