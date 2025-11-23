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
  
}



export default FinancialAccount;