import pkg from 'pg';
const { Pool } = pkg;
import config from '../config/index.js';

// Configuração do pool de conexões
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false, // Necessário para Neon
  },
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listeners para debugging
pool.on('connect', () => {
  console.log('Nova conexão estabelecida com o banco de dados');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente do banco de dados', err);
  process.exit(-1);
});

/**
 * Executa uma query no banco de dados
 * @param {string} text - SQL query
 * @param {Array} params - Parâmetros da query
 * @returns {Promise} Resultado da query
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro ao executar query', { text, error: error.message });
    throw error;
  }
};

/**
 * Obtém um cliente do pool para transações
 * @returns {Promise} Cliente do pool
 */
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Timeout de 5 segundos para liberar o cliente
  const timeout = setTimeout(() => {
    console.error('Cliente não foi liberado após 5 segundos!');
  }, 5000);

  // Sobrescreve o release para limpar o timeout
  client.release = () => {
    clearTimeout(timeout);
    client.release = release;
    return release();
  };

  return client;
};

/**
 * Testa a conexão com o banco de dados
 * @returns {Promise<boolean>}
 */
export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as now');
    console.log('Conexão com banco de dados OK:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Falha ao conectar com banco de dados:', error.message);
    return false;
  }
};

/**
 * Fecha todas as conexões do pool
 * @returns {Promise<void>}
 */
export const closePool = async () => {
  await pool.end();
  console.log('Pool de conexões fechado');
};

export default {
  query,
  getClient,
  testConnection,
  closePool,
  pool,
};
