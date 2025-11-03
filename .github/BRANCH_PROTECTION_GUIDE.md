# Guia de Proteção de Branch - GitHub

## Como Bloquear Push Direto na Main

### Via Interface do GitHub

1. **Acesse as configurações do repositório:**
   ```
   https://github.com/compass-estagio/backend-geral/settings/branches
   ```

2. **Adicione regra de proteção:**
   - Clique em **"Add branch protection rule"**

3. **Configure a regra:**

   **Branch name pattern:**
   ```
   main
   ```

   **Marque as seguintes opções:**

   #### Proteção Básica
   - ☑️ **Require a pull request before merging**
     - ☑️ Require approvals: **1** (ou mais)
     - ☑️ Dismiss stale pull request approvals when new commits are pushed
     - ☑️ Require review from Code Owners (opcional)

   #### Proteção contra Push Direto
   - ☑️ **Do not allow bypassing the above settings**
   - ☑️ **Include administrators** (importante!)

   #### Proteção de Histórico
   - ☑️ **Require linear history** (evita merge commits confusos)
   - ☑️ **Require conversation resolution before merging**

   #### Outras Proteções (Opcional)
   - ☑️ **Require status checks to pass before merging**
     - Selecione: "Sync homolog with main" (se quiser que o workflow rode antes)

   - ☑️ **Require branches to be up to date before merging**

4. **Salve:**
   - Clique em **"Create"** no final da página

## Resultado

Após configurar, tentativas de push direto na main serão bloqueadas:

```bash
git push origin main
# remote: error: GH006: Protected branch update failed
# To https://github.com/compass-estagio/backend-geral.git
#  ! [remote rejected] main -> main (protected branch hook declined)
```

## Workflow Obrigatório

Com a proteção ativada:

```
1. Criar feature branch
   git checkout -b feat/nova-feature

2. Desenvolver e commitar
   git add .
   git commit -m "feat: nova funcionalidade"

3. Push da feature branch
   git push origin feat/nova-feature

4. Abrir Pull Request no GitHub
   https://github.com/compass-estagio/backend-geral/compare

5. Code Review
   - Pelo menos 1 aprovação necessária
   - Todos os comentários resolvidos

6. Merge (após aprovação)
   - Via interface do GitHub
   - Automático para homolog via GitHub Actions
```

## Exceções Temporárias

Se PRECISAR fazer push direto (emergências):

### Opção 1: Desabilitar temporariamente
```
Settings → Branches → Editar regra → Desmarque "Include administrators"
```

### Opção 2: Bypass via GitHub CLI
```bash
gh pr create --fill
gh pr merge --admin --squash
```

⚠️ **Use apenas em emergências!**

## Configuração via GitHub CLI (Alternativo)

Você também pode configurar via linha de comando:

```bash
# Instalar GitHub CLI se não tiver
# https://cli.github.com/

# Proteger branch main
gh api repos/compass-estagio/backend-geral/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field enforce_admins=true \
  --field required_conversation_resolution=true \
  --field restrictions=null
```

## Verificar Proteção

Para ver se está protegida:

```bash
gh api repos/compass-estagio/backend-geral/branches/main/protection
```

Ou acesse:
```
https://github.com/compass-estagio/backend-geral/settings/branch_protection_rules
```

## Troubleshooting

### "Preciso fazer merge urgente mas não tenho aprovações"

1. Peça para outro dev revisar rapidamente
2. Ou temporariamente reduza para 0 aprovações (não recomendado)

### "GitHub Actions não consegue fazer push"

Certifique-se de que o workflow tem permissões:
```yaml
permissions:
  contents: write
```

E que "Allow GitHub Actions to create and approve pull requests" está marcado em:
```
Settings → Actions → General → Workflow permissions
```

### "Quero proteger homolog também"

Repita o processo para a branch `homolog`:
- Menos restritivo que main
- Talvez sem necessidade de aprovação
- Apenas para prevenir pushes acidentais
