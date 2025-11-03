# Configuração de Ambientes

Este projeto utiliza diferentes ambientes para desenvolvimento, homologação e produção.

## Ambientes Disponíveis

### 🔵 Development (Local)
- **Branch**: qualquer (local)
- **Banco**: Local ou desenvolvimento
- **Arquivo**: `.env`

### 🟡 Staging/Homolog (Vercel Preview)
- **Branch**: `homolog`
- **URL**: `seu-projeto-git-homolog.vercel.app`
- **Banco**: Neon PostgreSQL (Homolog)
- **Configuração**: Vercel Environment Variables (Preview)

### 🔴 Production (Vercel Production)
- **Branch**: `main`
- **URL**: `seu-projeto.vercel.app`
- **Banco**: Neon PostgreSQL (Produção)
- **Configuração**: Vercel Environment Variables (Production)

## Configuração Local

### 1. Criar arquivo .env

```bash
cp .env.example .env
```

### 2. Preencher com suas credenciais

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=sua-url-de-desenvolvimento
DATABASE_URL_UNPOOLED=sua-url-unpooled

# JWT
JWT_SECRET=seu-secret-local
JWT_EXPIRES_IN=7d
```

### 3. Para testar com banco de homolog localmente

```bash
cp .env.homolog .env
npm run dev
```

## Configuração na Vercel

### Variáveis para Preview (Homolog)

Acesse: `Vercel Dashboard → Settings → Environment Variables`

Adicione marcando **Preview**:

- `DATABASE_URL` - URL do banco de homologação
- `DATABASE_URL_UNPOOLED` - URL unpooled de homologação
- `JWT_SECRET` - Secret diferente de produção
- `JWT_EXPIRES_IN` - Ex: 7d
- `NODE_ENV` - staging

### Variáveis para Production

Adicione marcando **Production**:

- `DATABASE_URL` - URL do banco de produção
- `DATABASE_URL_UNPOOLED` - URL unpooled de produção
- `JWT_SECRET` - Secret forte de produção
- `JWT_EXPIRES_IN` - Ex: 7d
- `NODE_ENV` - production

## Fluxo de Deploy

```
feature/xyz → PR review → main → auto deploy (production)
                            ↓
                      GitHub Action
                            ↓
                        homolog → auto deploy (staging)
```

## URLs dos Ambientes

- **Produção**: https://seu-projeto.vercel.app
- **Homolog**: https://seu-projeto-git-homolog.vercel.app
- **Preview PRs**: https://seu-projeto-git-feat-xyz.vercel.app

## Migrations

### Local
```bash
npm run migrate
```

### Homolog
As migrations rodam automaticamente no deploy via `vercel-build` script.

### Production
As migrations rodam automaticamente no deploy via `vercel-build` script.

## Segurança

⚠️ **NUNCA commite arquivos .env com credenciais reais!**

Os seguintes arquivos estão no `.gitignore`:
- `.env`
- `.env.local`
- `.env.homolog`
- `.env.production`

## Troubleshooting

### Banco não conecta no Vercel
1. Verifique se as variáveis estão no ambiente correto (Preview/Production)
2. Teste com: `curl https://sua-url.vercel.app/api/health`
3. Verifique os logs: `Vercel Dashboard → Deployments → View Logs`

### Migrations não rodam
1. Verifique se `DATABASE_URL_UNPOOLED` está configurada
2. Verifique os logs de build no Vercel
3. Execute manualmente: `vercel env pull && npm run migrate`
