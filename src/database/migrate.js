import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

/**
 * Cria tabela de controle de migrations se não existir
 */
async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) UNIQUE NOT NULL,
      description VARCHAR(500),
      installed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      execution_time INTEGER,
      success BOOLEAN DEFAULT TRUE
    );
  `);
  console.log('✓ Tabela de controle de migrations garantida');
}

/**
 * Obtém as migrations já executadas
 */
async function getExecutedMigrations() {
  const result = await db.query(
    `SELECT version FROM ${MIGRATIONS_TABLE} WHERE success = TRUE ORDER BY version`
  );
  return new Set(result.rows.map(row => row.version));
}

/**
 * Lê e ordena os arquivos de migration
 */
function getMigrationFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(filename => {
    const match = filename.match(/^V(\d+)__(.+)\.sql$/);
    if (!match) {
      throw new Error(`Nome de migration inválido: ${filename}`);
    }

    return {
      filename,
      version: match[1],
      description: match[2].replace(/_/g, ' '),
      path: path.join(MIGRATIONS_DIR, filename),
    };
  });
}

/**
 * Executa uma migration
 */
async function executeMigration(migration) {
  const sql = fs.readFileSync(migration.path, 'utf8');
  const startTime = Date.now();

  console.log(`Executando: V${migration.version} - ${migration.description}`);

  try {
    await db.query(sql);
    const executionTime = Date.now() - startTime;

    await db.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (version, description, execution_time, success)
       VALUES ($1, $2, $3, TRUE)`,
      [migration.version, migration.description, executionTime]
    );

    console.log(`✓ V${migration.version} aplicada com sucesso (${executionTime}ms)`);
    return true;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    await db.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (version, description, execution_time, success)
       VALUES ($1, $2, $3, FALSE)`,
      [migration.version, migration.description, executionTime]
    );

    console.error(`✗ V${migration.version} falhou:`, error.message);
    return false;
  }
}

/**
 * Executa todas as migrations pendentes
 */
async function migrate() {
  console.log('🚀 Iniciando migrations...\n');

  try {
    await ensureMigrationsTable();

    const executedMigrations = await getExecutedMigrations();
    const allMigrations = getMigrationFiles();

    const pendingMigrations = allMigrations.filter(
      m => !executedMigrations.has(m.version)
    );

    if (pendingMigrations.length === 0) {
      console.log('✓ Nenhuma migration pendente. Banco de dados atualizado!');
      return;
    }

    console.log(`📋 ${pendingMigrations.length} migration(s) pendente(s)\n`);

    for (const migration of pendingMigrations) {
      const success = await executeMigration(migration);
      if (!success) {
        console.error('\n❌ Migration falhou. Abortando.');
        process.exit(1);
      }
    }

    console.log('\n✅ Todas as migrations foram aplicadas com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro ao executar migrations:', error);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

/**
 * Mostra status das migrations
 */
async function info() {
  try {
    await ensureMigrationsTable();

    const executedMigrations = await getExecutedMigrations();
    const allMigrations = getMigrationFiles();

    console.log('\n📊 Status das Migrations:\n');
    console.log('Versão | Status     | Descrição');
    console.log('-------|------------|----------');

    allMigrations.forEach(migration => {
      const status = executedMigrations.has(migration.version) ? '✓ Aplicada' : '⧗ Pendente';
      console.log(`V${migration.version.padEnd(5)} | ${status.padEnd(10)} | ${migration.description}`);
    });

    console.log(`\nTotal: ${allMigrations.length} migrations`);
    console.log(`Aplicadas: ${executedMigrations.size}`);
    console.log(`Pendentes: ${allMigrations.length - executedMigrations.size}\n`);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

// CLI
const command = process.argv[2];

switch (command) {
  case 'migrate':
    migrate();
    break;
  case 'info':
    info();
    break;
  default:
    console.log('Uso: node migrate.js [migrate|info]');
    process.exit(1);
}
