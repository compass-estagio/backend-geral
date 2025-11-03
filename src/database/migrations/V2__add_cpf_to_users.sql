-- Migration: Adiciona campo CPF na tabela users
-- Data: 2025-11-03
-- Descrição: Adiciona CPF como campo único para autenticação

-- Adicionar coluna CPF
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(11) UNIQUE;

-- Criar índice para CPF
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);

-- Comentário
COMMENT ON COLUMN users.cpf IS 'CPF do usuário (apenas números, 11 dígitos)';
