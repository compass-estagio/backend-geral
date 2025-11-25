import axios from 'axios';

export const findIfCustomerByCpf = async (cpf, baseUrl) => {
  try {
    const response = await axios.get(`${baseUrl}/customers/lookup/by-cpf/${cpf}`);
    return response.data; 
  } catch (error) {
    console.error(`Erro em findIfCustomerByCpf (${baseUrl}):`, error.response?.data);
    throw new Error(error.response?.data?.message || 'Falha ao buscar cliente por CPF na IF');
  }
};

export const createIfConsent = async (customerId, baseUrl) => {
  try {
    const permissions = [
      'CUSTOMER_DATA_READ',
      'ACCOUNTS_READ',
      'BALANCES_READ',
      'TRANSACTIONS_READ',
      'INVESTMENTS_READ'
    ];
    const response = await axios.post(`${baseUrl}/consents`, {
      customerId,
      permissions
    });
    return response.data; 
  } catch (error) {
    console.error(`Erro em createIfConsent (${baseUrl}):`, error.response?.data);
    throw new Error(error.response?.data?.message || 'Falha ao criar consentimento na IF');
  }
};

export const discoverIfAccounts = async (customerId, baseUrl) => {
  try {
    const response = await axios.get(`${baseUrl}/customers/${customerId}/accounts`);
    return response.data; 
  } catch (error) {
    console.error(`Erro em discoverIfAccounts (${baseUrl}):`, error.response?.data);
    throw error; 
  }
};

export const getIfAccountBalance = async (accountId, baseUrl) => {
  try {
    const response = await axios.get(`${baseUrl}/accounts/${accountId}/balance`);
    return response.data; 
  } catch (error) {
     console.error(`Erro em getIfAccountBalance (${baseUrl}):`, error.response?.data);
    throw error;
  }
};

export const getIfTransactions = async (accountId, baseUrl) => {
  try {
    const response = await axios.get(`${baseUrl}/transactions/${accountId}`);
    return response.data; 
  } catch (error) {
     console.error(`Erro em getIfTransactions (${baseUrl}):`, error.response?.data);
    throw error;
  }
};

export const getIfInvestments = async (accountId, baseUrl) => {
  try {
    const url = `${baseUrl}/investments/accounts/${accountId}`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data.success) {
      return response.data.investments;
    }
    
    return [];

  } catch (error) {
    if (error.response && error.response.status === 404) {
      return [];
    }
    console.error(`Erro em getIfInvestments (${baseUrl}):`, error.message);
    return [];
  }
};

export const getIfProducts = async (baseUrl) => {
  try {
    const response = await axios.get(`${baseUrl}/products`);
    
    if (response.data && response.data.products) {
      return response.data.products;
    }
    return [];
  } catch (error) {
    console.error(`Erro ao buscar produtos na IF ${baseUrl}:`, error.message);
    return [];
  }
};