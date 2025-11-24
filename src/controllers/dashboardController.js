import * as InvestmentAnalysisService from '../services/investmentAnalysis.service.js';

/**
 * Endpoint para carregar os dados do Dashboard (Gráficos + Sugestões)
 * GET /api/dashboard
 */
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id; 

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não identificado.' 
      });
    }
    
    const dashboardData = await InvestmentAnalysisService.analyzeUserPortfolio(userId);
    
    return res.status(200).json({
      success: true,
      message: 'Dashboard atualizado com sucesso.',
      data: dashboardData
    });

  } catch (error) {
    console.error('Erro fatal no Dashboard Controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Não foi possível gerar o dashboard no momento.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};