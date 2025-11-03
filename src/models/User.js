import db from '../database/db.js';
import bcrypt from 'bcrypt';

/**
 * Model de Usuário
 */
class User {
  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @param {string} userData.cpf - CPF (apenas números)
   * @param {string} userData.name - Nome completo
   * @param {string} userData.email - Email
   * @param {string} userData.password - Senha em texto plano (será hasheada)
   * @returns {Promise<Object>} Usuário criado
   */
  static async create({ cpf, name, email, password }) {
    // Hash da senha
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (cpf, name, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, cpf, name, email, created_at, updated_at
    `;

    const result = await db.query(query, [cpf, name, email, password_hash]);
    return result.rows[0];
  }

  /**
   * Busca usuário por CPF
   * @param {string} cpf - CPF do usuário
   * @returns {Promise<Object|null>} Usuário encontrado ou null
   */
  static async findByCpf(cpf) {
    const query = `
      SELECT id, cpf, name, email, password_hash, created_at, updated_at
      FROM users
      WHERE cpf = $1 AND deleted_at IS NULL
    `;

    const result = await db.query(query, [cpf]);
    return result.rows[0] || null;
  }

  /**
   * Busca usuário por ID
   * @param {number} id - ID do usuário
   * @returns {Promise<Object|null>} Usuário encontrado ou null
   */
  static async findById(id) {
    const query = `
      SELECT id, cpf, name, email, created_at, updated_at
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object|null>} Usuário encontrado ou null
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, cpf, name, email, password_hash, created_at, updated_at
      FROM users
      WHERE email = $1 AND deleted_at IS NULL
    `;

    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Verifica se a senha está correta
   * @param {string} password - Senha em texto plano
   * @param {string} hash - Hash da senha
   * @returns {Promise<boolean>} True se a senha está correta
   */
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Atualiza dados do usuário
   * @param {number} id - ID do usuário
   * @param {Object} updates - Campos para atualizar
   * @returns {Promise<Object>} Usuário atualizado
   */
  static async update(id, updates) {
    const allowedFields = ['name', 'email'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Filtra apenas campos permitidos
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    // Adiciona updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, cpf, name, email, created_at, updated_at
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Soft delete do usuário
   * @param {number} id - ID do usuário
   * @returns {Promise<boolean>} True se deletado com sucesso
   */
  static async delete(id) {
    const query = `
      UPDATE users
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0;
  }

  /**
   * Lista todos os usuários
   * @param {Object} options - Opções de paginação
   * @param {number} options.limit - Limite de registros
   * @param {number} options.offset - Offset para paginação
   * @returns {Promise<Array>} Lista de usuários
   */
  static async findAll({ limit = 10, offset = 0 } = {}) {
    const query = `
      SELECT id, cpf, name, email, created_at, updated_at
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }
}

export default User;
