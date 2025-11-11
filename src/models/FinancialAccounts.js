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
        (user_id, institution_name, account_type, balance, currency, 
         if_customer_id, if_account_id)
      VALUES 
        ($1, $2, $3, $4, 'BRL', $5, $6)
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
  
}

export default FinancialAccount;