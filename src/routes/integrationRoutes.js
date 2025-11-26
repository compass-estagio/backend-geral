import { Router } from 'express';
import * as controller from '../controllers/integrationController.js';
import { authenticateToken } from '../middlewares/auth.js'; 

const router = Router();

/**
 * @route GET /api/integration/institutions
 * @desc Lista todas as IFs (Instituições Financeiras) disponíveis para conexão.
 * @access Private
 */
router.get(
  '/institutions',
  authenticateToken,
  controller.listInstitutions
);

/**
 * @route POST /api/integration/connect
 * @desc Conecta uma nova Instituição Financeira (IF) a um usuário.
 * @desc Executa o fluxo de descoberta de contas e consentimento.
 * @access Private
 */
router.post(
  '/connect',
  authenticateToken, 
  controller.connectInstitution
);

 /**
 * @route GET /api/integration/dashboard/accounts
 * @desc Busca todos os saldos consolidados das contas conectadas do usuário.
 * @access Private
 */
router.get(
  '/dashboard/accounts',
  authenticateToken,
  controller.getConsolidatedAccounts
);

/**
 * @route GET /api/integration/dashboard/accounts/:localAccountId/transactions
 * @desc Busca o extrato (transações) de UMA conta conectada específica.
 * @access Private
 */
router.get(
  '/dashboard/accounts/:localAccountId/transactions',
  authenticateToken,
  controller.getTransactionsForAccount
);

/**
 * @route GET /api/integration/dashboard/investments
 * @desc Busca TODOS os investimentos de TODAS as contas do usuário.
 */
router.get(
  '/dashboard/investments', 
  authenticateToken,
  controller.getAllUserInvestments
);
export default router;