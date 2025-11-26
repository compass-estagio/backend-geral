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
    const authToken = req.headers.authorization; 

    const localAccounts = await FinancialAccount.findByUserId(userId);

    if (!localAccounts || localAccounts.length === 0) {
      return res.status(200).json({ total_items: 0, investments: [] });
    }

    const institutions = await Institution.findAll();
    const institutionMap = new Map(institutions.map(i => [i.name, i.base_url]));

    const promises = localAccounts.map(async (account) => {
      const baseUrl = institutionMap.get(account.institution_name);
      const externalId = account.if_account_id; 

      if (!baseUrl || !externalId) return [];

      try {
        const rawInvestments = await IntegrationService.getIfInvestments(
          externalId, 
          baseUrl,
          authToken 
        );

        if (!rawInvestments || !Array.isArray(rawInvestments)) {
          return [];
        }

        return rawInvestments.map(inv => {
          const productData = typeof inv.productId === 'object' ? inv.productId : {};
          
          return {
            _id: inv._id,
            investedAmount: inv.investedAmount,
            quantity: inv.quantity,
            purchaseDate: inv.purchaseDate,
            
            name: productData.name || "Investimento não identificado",
            type: productData.productType || "OUTROS",
            ticker: productData.ticker || null,
            rateType: productData.rateType || null,
            rateValue: productData.rateValue || null,
            
            source_institution: account.institution_name,
            local_account_id: account.id
          };
        });

      } catch (error) {
        console.error(`Erro ao processar conta ${account.id}:`, error.message);
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

const getEstimatedReturn = (productName, type) => {
  const name = productName.toLowerCase();
  const t = type.toLowerCase();

  if (t === 'treasury' || name.includes('tesouro')) {
      if (name.includes('selic')) return 11.25; 
      if (name.includes('ipca')) return 6.15;  
      if (name.includes('prefixado')) return 12.50;
      return 10.50; 
  }

  if (t === 'crypto' || name.includes('bitcoin') || name.includes('btc')) return 145.20;
  if (name.includes('ethereum') || name.includes('eth')) return 85.5;

  if (name.includes('petrobras') || name.includes('petr4')) return 35.4;
  if (name.includes('vale') || name.includes('vale3')) return -12.5; 
  if (name.includes('weg') || name.includes('wege3')) return 22.1;
  if (name.includes('itau') || name.includes('itub4')) return 18.7;

  if (name.includes('hglg')) return 9.2;
  if (name.includes('mxrf') || name.includes('maxi renda')) return 12.5;
  if (name.includes('knri')) return 8.8;
  if (name.includes('logistica')) return 10.1;

  if (name.includes('alaska')) return 15.2;
  if (name.includes('verde')) return 13.5;

  if (t === 'stock' || t === 'acao') return 12.5;
  if (t === 'fii') return 10.0;
  if (t === 'fundo' || t === 'funds') return 11.0;

  return 0; 
};

export const getMarketProducts = async (req, res) => {
  try {
    const institutions = await Institution.findAll();
    
    const promises = institutions.map(async (inst) => {
      if (!inst.base_url) return [];
      try {
        const products = await IntegrationService.getIfProducts(inst.base_url);
        return products.map(p => ({ ...p, institutionName: inst.name }));
      } catch (error) {
        console.error(`Erro ao buscar produtos na ${inst.name}:`, error.message);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const allProducts = results.flat();

    const formattedProducts = allProducts.map(p => {
      
      let risk = 'médio';
      if (p.riskLevel) {
          const r = p.riskLevel.toUpperCase();
          if (r === 'LOW') risk = 'baixo';
          else if (r === 'MEDIUM') risk = 'médio';
          else if (r === 'HIGH') risk = 'alto';
      }

      const type = p.productType ? p.productType.toLowerCase() : 'outros';


      let finalReturn = Number(p.rateValue) || 0;
      let returnType = p.rateType === 'CDI' ? 'indice' : 'percentual';

      if (finalReturn === 0) {
        finalReturn = getEstimatedReturn(p.name, type);
        returnType = 'percentual'; 
      }

      let finalLiquidity = p.liquidity;

      if (!finalLiquidity || finalLiquidity === 'No Maturity') {
        if (type === 'treasury' || p.name.toLowerCase().includes('tesouro')) {
            finalLiquidity = 'D+1'; 
        } else if (type === 'stock' || type === 'acao' || type === 'fii') {
            finalLiquidity = 'D+2'; 
        } else if (type === 'crypto' || type === 'cripto') {
            finalLiquidity = 'Imediata'; 
        } else if (type === 'funds' || type === 'fundo') {
            finalLiquidity = 'D+30'; 
        } else {
            finalLiquidity = 'No Vencimento'; 
        }
      }

      return {
        id: p._id || p.id,
        name: p.name,
        institution: p.institution || p.institutionName, 
        type: type,
        minInvestment: Number(p.minInvestmentAmount) || 0, 
        returnValue: finalReturn, 
        returnType: returnType,
        currentReturn: finalReturn,
        liquidity: finalLiquidity,
        riskLevel: risk, 
        rating: 4.5 
      };
    });

    res.status(200).json(formattedProducts);

  } catch (error) {
    console.error("Erro no market products:", error.message);
    res.status(500).json({ message: 'Falha ao buscar catálogo.' });
  }
};