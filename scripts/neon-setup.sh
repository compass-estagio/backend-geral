#!/bin/bash

# Script para configurar branches do Neon PostgreSQL
# Uso: ./scripts/neon-setup.sh

set -e

echo "🌳 Neon Database Branching Setup"
echo "=================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se neonctl está instalado
if ! command -v neonctl &> /dev/null; then
    echo -e "${YELLOW}⚠️  neonctl não está instalado${NC}"
    echo "Instalar agora? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        npm install -g neonctl
    else
        echo "Abortando. Instale neonctl com: npm install -g neonctl"
        exit 1
    fi
fi

# Verificar se está autenticado
if ! neonctl projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Você não está autenticado${NC}"
    echo "Por favor, execute: neonctl auth"
    exit 1
fi

# Listar projetos
echo -e "${BLUE}Seus projetos Neon:${NC}"
neonctl projects list

echo ""
read -p "Digite o ID do projeto: " PROJECT_ID

# Verificar branches existentes
echo ""
echo -e "${BLUE}Branches existentes:${NC}"
neonctl branches list --project-id "$PROJECT_ID"

echo ""
echo "Deseja criar a branch 'homolog'? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${BLUE}Criando branch 'homolog' a partir de 'main'...${NC}"

    neonctl branches create \
        --name homolog \
        --parent main \
        --project-id "$PROJECT_ID"

    echo ""
    echo -e "${GREEN}✅ Branch 'homolog' criada com sucesso!${NC}"
    echo ""

    # Obter connection strings
    echo -e "${BLUE}Connection Strings:${NC}"
    echo ""
    echo "📌 Pooled (para aplicação):"
    neonctl connection-string homolog --pooled --project-id "$PROJECT_ID"

    echo ""
    echo "📌 Unpooled (para migrations):"
    neonctl connection-string homolog --unpooled --project-id "$PROJECT_ID"

    echo ""
    echo -e "${YELLOW}Próximos passos:${NC}"
    echo "1. Copie as connection strings acima"
    echo "2. Vá para Vercel → Settings → Environment Variables"
    echo "3. Adicione:"
    echo "   - DATABASE_URL (pooled) → Preview"
    echo "   - DATABASE_URL_UNPOOLED (unpooled) → Preview"
    echo "4. Faça redeploy da branch homolog"
    echo ""
else
    echo "Operação cancelada."
fi
