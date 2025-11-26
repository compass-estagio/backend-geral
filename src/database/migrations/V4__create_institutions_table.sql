-- Migration: Cria tabela para armazenar as IFs (Bancos) disponíveis
CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE, 
    base_url VARCHAR(512) NOT NULL UNIQUE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insere as IFs
INSERT INTO institutions (name, base_url) 
VALUES ('IF-Mauro', 'https://api-if-mauro-gomes.vercel.app/openfinance')
ON CONFLICT (name) DO NOTHING;

INSERT INTO institutions (name, base_url) 
VALUES ('IF-Thalles', 'https://thalles-if.vercel.app/openfinance')
ON CONFLICT (name) DO NOTHING;