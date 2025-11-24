import * as MarketDataService from './marketData.service.js';
import * as IntegrationService from './integration.service.js';
import FinancialAccount from '../models/FinancialAccounts.js';
import Institution from '../models/Institution.js';

/**
 * [HELPER] Calcula rendimento estimado da Poupança
 */
function calculatePoupancaYield(selicRate) {
  if (selicRate > 8.5) return 6.17; 
  return selicRate * 0.70;
}

/**
 * [CORE] Analisa a carteira e gera dados para o Dashboard (Gráficos + Sugestões)
 * @param {number} userId 
 */
export const analyzeUserPortfolio = async (userId) => {
  const { selic } = await MarketDataService.getMarketRates();

  const localAccounts = await FinancialAccount.findByUserId(userId);
  const institutions = await Institution.findAll();
  const institutionMap = new Map(institutions.map(i => [i.name, i.base_url]));

  const dashboard = {
    summary: {
      totalBalance: 0,
      totalInvested: 0,
      grandTotal: 0
    },
    allocation: {
      'POUPANCA': 0,
      'CDB': 0,
      'STOCK': 0,
      'FII': 0,
      'CRYPTO': 0,
      'TREASURY': 0,
      'FUNDS': 0,
      'OTHERS': 0
    },
    suggestions: []
  };

  for (const account of localAccounts) {
    const baseUrl = institutionMap.get(account.institution_name);
    if (!baseUrl) continue;

    if (account.account_type === 'savings') {
      const balData = await IntegrationService.getIfAccountBalance(account.if_account_id, baseUrl);
      const balance = parseFloat(balData.balance || 0);

      if (balance > 0) {
        dashboard.summary.totalBalance += balance;
        dashboard.allocation['POUPANCA'] += balance;

        const poupancaYield = calculatePoupancaYield(selic);

        if (balance > 100 && poupancaYield < selic) {
          dashboard.suggestions.push({
            type: 'WARNING',
            title: 'Poupança rendendo pouco',
            message: `Você tem R$ ${balance.toFixed(2)} na Poupança. O Tesouro Selic rende ${selic}% a.a.`,
            score: 1
          });
        }
      }
    }

    if (account.account_type === 'investment') {
      const positions = await IntegrationService.getIfInvestments(account.if_account_id, baseUrl);

      for (const pos of positions) {
        const amount = parseFloat(pos.investedAmount || 0);
        const product = pos.productId; 
        
        if (!product) continue;

        dashboard.summary.totalInvested += amount;
        
        const typeKey = product.productType ? product.productType.toUpperCase() : 'OTHERS';
        if (dashboard.allocation[typeKey] !== undefined) {
          dashboard.allocation[typeKey] += amount;
        } else {
          dashboard.allocation['OTHERS'] += amount;
        }

        if (typeKey === 'CDB' && product.rateType === 'CDI') {
          if (product.rateValue < 100) {
            dashboard.suggestions.push({
              type: 'OPPORTUNITY',
              title: `Troque seu ${product.name}`,
              message: `Este CDB rende apenas ${product.rateValue}% do CDI. Existem opções pagando 110% do CDI.`,
              score: 2
            });
          }
        }

        if (typeKey === 'FUNDS' && product.adminFee > 2) {
          dashboard.suggestions.push({
            type: 'ALERT',
            title: `Taxa alta em ${product.name}`,
            message: `Taxa de administração de ${product.adminFee}%. Verifique a performance.`,
            score: 3
          });
        }
      }
    }
  }

  dashboard.summary.grandTotal = dashboard.summary.totalBalance + dashboard.summary.totalInvested;
  dashboard.suggestions.sort((a, b) => a.score - b.score);

  return dashboard;
};