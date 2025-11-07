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
    
    const ifCustomer = await IntegrationService.findIfCustomerByCpf(user.cpf, baseUrl);

    let ifAccounts;
    try {
      ifAccounts = await IntegrationService.discoverIfAccounts(ifCustomer._id, baseUrl);
    
    } catch (error) {
      if (error.response && (error.response.status === 403 || error.response.status === 404)) {
        console.log(`Falha na primeira tentativa (${error.response.status}). Criando consentimento...`);
        
        await IntegrationService.createIfConsent(ifCustomer._id, baseUrl);
        
        ifAccounts = await IntegrationService.discoverIfAccounts(ifCustomer._id, baseUrl);
      } else {
        throw error;
      }
    }
    
    const savedAccounts = [];
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
    }
    
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