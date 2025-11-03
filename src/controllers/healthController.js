import db from '../database/db.js';

/**
 * Health check endpoint
 * Verifica a saúde da aplicação e conectividade com o banco de dados
 * @route GET /health
 */
export const healthCheck = async (req, res) => {
  // Extrai informações do banco de dados da URL (sem expor senha)
  const getDatabaseInfo = () => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return { host: 'not configured' };

    try {
      const url = new URL(dbUrl);
      return {
        host: url.hostname,
        database: url.pathname.replace('/', ''),
        // Mostra apenas os primeiros 20 caracteres do host para identificação
        identifier: url.hostname.substring(0, 30) + '...',
      };
    } catch {
      return { host: 'invalid url' };
    }
  };

  const healthcheck = {
    uptime: process.uptime(),
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      VERCEL_ENV: process.env.VERCEL_ENV || 'local',
      VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF || 'local',
    },
    database_config: getDatabaseInfo(),
  };

  try {
    // Testa a conexão com o banco de dados
    const result = await db.query('SELECT NOW() as now, version() as version, current_database() as dbname');

    healthcheck.database = {
      status: 'connected',
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
      database_name: result.rows[0].dbname,
    };

    // Verifica se há tabelas criadas
    const tables = await db.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    healthcheck.database.tables = parseInt(tables.rows[0].count);

    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'ERROR';
    healthcheck.database = {
      status: 'disconnected',
      error: error.message,
    };

    res.status(503).json(healthcheck);
  }
};
