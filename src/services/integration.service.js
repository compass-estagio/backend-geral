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
      'TRANSACTIONS_READ'
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

