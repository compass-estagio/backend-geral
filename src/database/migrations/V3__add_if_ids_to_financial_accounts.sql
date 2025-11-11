-- Migration: Adiciona colunas de IDs externos da IF
-- Descrição: Armazena os IDs únicos da API Padronizada (IF)

-- Adiciona os IDs da API Padronizada (IF) na tabela de contas
ALTER TABLE financial_accounts 
ADD COLUMN IF NOT EXISTS if_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS if_account_id VARCHAR(255);

-- Adiciona um índice único para impedir a conexão da mesma conta duas vezes
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_if_account 
ON financial_accounts(institution_name, if_account_id);

-- Comentários
COMMENT ON COLUMN financial_accounts.if_customer_id IS 'ID do Cliente na Instituição Financeira (IF) externa (ex: cus_001)';
COMMENT ON COLUMN financial_accounts.if_account_id IS 'ID da Conta na IF externa (ex: acc_001)';