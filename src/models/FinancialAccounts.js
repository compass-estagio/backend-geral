import db from '../database/db.js';

class FinancialAccount {
  
  /**
   * @param {Object} accountData 
   * @param {number} accountData.userId 
   * @param {string} accountData.institutionName 
   * @param {string} accountData.accountType 
   * @param {number} accountData.balance 
   * @param {string} accountData.ifAccountId 
   * @returns {Promise<Object>} 
   */

  static async create({ 
    userId, 
    institutionName, 
    accountType, 
    balance,
    ifCustomerId, 
    ifAccountId 
  }) {

    const query = `
      INSERT INTO financial_accounts 
        (user_id, institution_name, account_type, balance, currency, if_customer_id, if_account_id)
      VALUES 
        ($1, $2, $3, $4, 'BRL', $5, $6)
      ON CONFLICT (institution_name, if_account_id) 
      DO UPDATE SET 
        balance = EXCLUDED.balance,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await db.query(query, [
      userId, 
      institutionName, 
      accountType, 
      balance,
      ifCustomerId,
      ifAccountId
    ]);
    return result.rows[0];
  }

  /**
   * Busca todas as contas financeiras de um usuário
   * @param {number} userId - ID do usuário (da tabela 'users')
   * @returns {Promise<Array>} Lista de contas
   */

  static async findByUserId(userId) {
    const query = `
      SELECT id, institution_name, account_type, balance, currency, 
             if_account_id, created_at
      FROM financial_accounts
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

/**
   * Busca uma conta financeira pelo seu ID local (PostgreSQL)
   * @param {number} id - ID da tabela 'financial_accounts'
   * @returns {Promise<Object|null>} A conta encontrada
   */
  static async findById(id) {
    const query = `
      SELECT *
      FROM financial_accounts
      WHERE id = $1 AND deleted_at IS NULL
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

 /**
   * Remove TODAS as contas de uma instituição para um usuário.
   * Usado quando o cliente (CPF) não é mais encontrado na IF (Erro 404).
   */
  static async deleteByUserIdAndInstitution(userId, institutionName) {
    const query = `
      DELETE FROM financial_accounts 
      WHERE user_id = $1 AND institution_name = $2
    `;
    await db.query(query, [userId, institutionName]);
  }

  /**
   * Remove contas que existem no banco local mas NÃO vieram na lista da API.
   * Usado para sincronizar: se a conta foi fechada na IF, removemos aqui.
   */
  static async deleteMissingAccounts({ userId, institutionName, activeIds }) {
    if (!activeIds || activeIds.length === 0) {
        return await this.deleteByUserIdAndInstitution(userId, institutionName);
    }
    const query = `
      DELETE FROM financial_accounts 
      WHERE user_id = $1 
        AND institution_name = $2
        AND if_account_id NOT IN (${activeIds.map((_, i) => `$${i + 3}`).join(', ')})
    `;
    await db.query(query, [userId, institutionName, ...activeIds]);
  }
}

export default FinancialAccount;