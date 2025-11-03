import db from './src/database/db.js';

async function testDatabase() {
  console.log('🔍 Verificando estrutura do banco de dados...\n');

  try {
    // Listar tabelas
    const tables = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tabelas criadas:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Contar registros
    console.log('\n📈 Status das tabelas:');
    for (const row of tables.rows) {
      const count = await db.query(`SELECT COUNT(*) as count FROM ${row.table_name}`);
      console.log(`  ${row.table_name}: ${count.rows[0].count} registros`);
    }

    console.log('\n✅ Banco de dados conectado e funcionando!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await db.closePool();
  }
}

testDatabase();
