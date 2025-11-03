import db from '../database/db.js';

/**
 * Health check endpoint
 * Verifica a saúde da aplicação e conectividade com o banco de dados
 * @route GET /health
 */
export const healthCheck = async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Testa a conexão com o banco de dados
    const result = await db.query('SELECT NOW() as now, version() as version');

    healthcheck.database = {
      status: 'connected',
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
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
