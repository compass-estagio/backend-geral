import * as IntegrationService from '../services/integration.service.js';
import User from '../models/User.js';
import FinancialAccount from '../models/FinancialAccounts.js'; 
import Institution from '../models/Institution.js'; 

export const connectInstitution = async (req, res) => {
  try {
    const userId = req.user.id;
    const { institutionId } = req.body; 

    const user = await User.findById(userId);
    const institution = await Institution.findById(institutionId);

    if (!user) return res.status(401).json({ message: 'Usuário não autenticado.' });
    if (!institution) return res.status(404).json({ message: 'Instituição não encontrada.' });

    const { base_url: baseUrl, name: institutionName } = institution;
    
    let ifCustomer;
    try {
      ifCustomer = await IntegrationService.findIfCustomerByCpf(user.cpf, baseUrl);
    } catch (error) {
      const isNotFound = 
        (error.response && error.response.status === 404) || 
        error.message.includes('404') ||
        (error.response?.data?.message && error.response.data.message.includes('not found'));

      if (isNotFound) {
        console.log(`[Sync] Cliente não encontrado na ${institutionName} (404). Limpando dados locais...`);
        
        await FinancialAccount.deleteByUserIdAndInstitution(userId, institutionName);
        
        return res.status(200).json({ 
          message: `Vínculo removido: cliente não encontrado na instituição ${institutionName}.`,
          accountsAdded: [] 
        });
      }
      throw error; 
    }

    let ifAccounts;
    try {
      ifAccounts = await IntegrationService.discoverIfAccounts(ifCustomer._id, baseUrl);
    } catch (error) {
      if (error.response && (error.response.status === 403 || error.response.status === 404)) {
        console.log(`[Sync] Renovando consentimento para ${institutionName}...`);
        await IntegrationService.createIfConsent(ifCustomer._id, baseUrl);
        ifAccounts = await IntegrationService.discoverIfAccounts(ifCustomer._id, baseUrl);
      } else {
        throw error;
      }
    }
    
    const savedAccounts = [];
    const activeIfAccountIds = [];

    for (const account of ifAccounts) {
      const newAccount = await FinancialAccount.create({
        userId: user.id,
        institutionName: institutionName, 
        accountType: account.type, 
        balance: account.balance,
        ifCustomerId: ifCustomer._id,  
        ifAccountId: account._id,   
      });
      savedAccounts.push(newAccount);
      activeIfAccountIds.push(account._id);
    }

    

    await FinancialAccount.deleteMissingAccounts({
      userId: user.id,
      institutionName: institutionName,
      activeIds: activeIfAccountIds
    });
    
    res.status(201).json({ 
      message: `Instituição '${institutionName}' conectada com sucesso!`,
      accountsAdded: savedAccounts 
    });

  } catch (error) {
    console.error("Erro fatal no fluxo de conexão:", error.message);
    res.status(500).json({ 
      message: 'Falha ao conectar instituição.', 
      error: error.message 
    });
  }
};

export const listInstitutions = async (req, res) => {
   try {
     const institutions = await Institution.findAll();
     res.status(200).json(institutions);
   } catch (error) {
     res.status(500).json({ message: 'Falha ao listar instituições.' });
   }
};

export const getConsolidatedAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const localAccounts = await FinancialAccount.findByUserId(userId);

    if (!localAccounts || localAccounts.length === 0) {
      return res.status(200).json([]); 
    }
    
    const institutions = await Institution.findAll();
    const institutionMap = new Map(institutions.map(i => [i.name, i.base_url]));

    const consolidatedAccounts = [];
    for (const account of localAccounts) {
      const baseUrl = institutionMap.get(account.institution_name);
      if (!baseUrl) continue; 

      try {
        const balanceResponse = await IntegrationService.getIfAccountBalance(
          account.if_account_id,
          baseUrl
        );
        
        consolidatedAccounts.push({
          localId: account.id,
          institution: account.institution_name,
          type: account.account_type,
          ifAccountId: account.if_account_id,
          balance: balanceResponse.balance 
        });

      } catch (error) {
        consolidatedAccounts.push({
          localId: account.id,
          institution: account.institution_name,
          type: account.account_type,
          ifAccountId: account.if_account_id,
          balance: null,
          error: "Não foi possível buscar o saldo. (Consentimento pode ter expirado)"
        });
      }
    }

    res.status(200).json(consolidatedAccounts);

  } catch (error) {
    console.error("Erro ao consolidar contas:", error.message);
    res.status(500).json({ message: 'Falha ao buscar dados consolidados.' });
  }
};

export const getTransactionsForAccount = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { localAccountId } = req.params; 

    const localAccount = await FinancialAccount.findById(localAccountId);

    if (!localAccount || localAccount.user_id !== userId) {
      return res.status(403).json({ message: "Acesso negado a esta conta." });
    }

    const institution = await Institution.findByName(localAccount.institution_name);
    if (!institution) {
      return res.status(404).json({ message: "Instituição não encontrada." });
    }

    const transactions = await IntegrationService.getIfTransactions(
      localAccount.if_account_id, 
      institution.base_url
    );

    res.status(200).json(transactions);

  } catch (error) {
    console.error("Erro ao buscar transações consolidadas:", error.message);
    
    if (error.response && error.response.status === 403) {
      return res.status(403).json({ 
        message: 'Acesso negado pela Instituição Financeira.',
        error: error.response.data?.error || 'Consentimento inválido ou expirado.'
      });
    }
    res.status(500).json({ message: 'Falha ao buscar transações.' });
  }
};

export const getAllUserInvestments = async (req, res) => {
  try {
    const userId = req.user.id;

    const localAccounts = await FinancialAccount.findByUserId(userId);

    if (!localAccounts || localAccounts.length === 0) {
      return res.status(200).json([]); 
    }

    const institutions = await Institution.findAll();
    const institutionMap = new Map(institutions.map(i => [i.name, i.base_url]));

    const promises = localAccounts.map(async (account) => {
      const baseUrl = institutionMap.get(account.institution_name);
      
      if (!baseUrl) return [];

      try {
        const investments = await IntegrationService.getIfInvestments(
          account.if_account_id,
          baseUrl
        );

        return investments.map(inv => ({
          ...inv,
          source_institution: account.institution_name,
          local_account_id: account.id
        }));

      } catch (error) {
        console.error(`Erro ao buscar investimentos da conta ${account.id}:`, error.message);
        return [];
      }
    });

    const results = await Promise.all(promises);

    const allInvestments = results.flat();

    res.status(200).json({
      total_items: allInvestments.length,
      investments: allInvestments
    });

  } catch (error) {
    console.error("Erro geral ao consolidar investimentos:", error.message);
    res.status(500).json({ message: 'Falha ao buscar carteira consolidada.' });
  }
};