import * as MarketDataService from './marketData.service.js'; 
import * as IntegrationService from './integration.service.js';
import FinancialAccount from '../models/FinancialAccounts.js';
import Institution from '../models/Institution.js';

/**
 * Calcula o rendimento anual da poupança com base na Selic.
 * @param {number} selicRate - A taxa Selic em % (ex: 10.5)
 * @returns {number} O rendimento anual em decimal (ex: 0.0617)
 */
function calculatePoupancaYield(selicRate) {
   const selicDecimal = selicRate / 100; 

   if (selicDecimal > 0.085) {
      return 0.0617; 
   } else {
      return selicDecimal * 0.70;
   }
}

/**
 * Analisa todos os investimentos de um usuário e gera sugestões.
 * @param {number} userId - O ID do usuário logado
 * @returns {Promise<Array<string>>} Uma lista de sugestões em texto.
 */
export const analyzeUserInvestments = async (userId) => {
   const { selic, cdi } = await MarketDataService.getMarketRates();
   const selicDecimal = selic / 100; 

   const localAccounts = await FinancialAccount.findByUserId(userId);
   const institutions = await Institution.findAll();

   const institutionMap = new Map(institutions.map(i => [i.name, i.base_url]));

   const suggestions = [];

   for (const account of localAccounts) {
      const baseUrl = institutionMap.get(account.institution_name);
      if (!baseUrl) continue; 

      if (account.account_type === 'savings') {
         try {
            const balanceResponse = await IntegrationService.getIfAccountBalance(
               account.if_account_id,
               baseUrl
            );
            const balance = parseFloat(balanceResponse.balance);

            const poupancaYield = calculatePoupancaYield(selic);

            if (balance > 100 && poupancaYield < selicDecimal) {
               suggestions.push(
               `Você tem R$ ${balance.toFixed(2)} na Poupança (${account.institution_name}) 
               rendendo ~${(poupancaYield * 100).toFixed(2)}% ao ano. 
               Considere mover para um Tesouro Selic (ou CDB 100%) 
               que rende ${selic.toFixed(2)}% ao ano com segurança similar.`
               );
            }
         } catch (error) {
            console.error(`Falha ao analisar poupança ${account.id}:`, error.message);
         }
      }

      if (account.account_type === 'investment') {
         try {
            const investments = await IntegrationService.getIfAccountTransactions(
               account.if_account_id,
               baseUrl
            );

            for (const inv of investments) {
               if (!inv.metadata || inv.category === 'POUPANCA') continue; 

               if (inv.metadata.rate_type === 'CDI') {
                  const userRate = parseFloat(inv.metadata.rate); 
                  
                  if (userRate < 1.0) {
                     suggestions.push(
                        `Seu ${inv.description || 'investimento'} de R$ ${parseFloat(inv.amount).toFixed(2)} 
                        rende apenas ${userRate * 100}% do CDI. 
                        Existem opções mais rentáveis (100% do CDI ou mais) com liquidez diária.`
                     );
                  }
               }
            }
         } catch (error) {
            console.error(`Falha ao analisar investimentos ${account.id}:`, error.message);
         }
      }
   }

   return suggestions;
};