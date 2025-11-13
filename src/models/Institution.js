import db from '../database/db.js';

class Institution {
  static async findById(id) {
    const query = `SELECT * FROM institutions WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
  
  static async findAll() {
    const query = `SELECT id, name, base_url FROM institutions ORDER BY name`;
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Busca uma instituição pelo nome
   * @param {string} name - Nome da instituição
   * @returns {Promise<Object|null>} A instituição encontrada
   */
  static async findByName(name) {
    const query = `
      SELECT * FROM institutions WHERE name = $1
    `;
    const result = await db.query(query, [name]);
    return result.rows[0] || null;
  }
}
export default Institution;