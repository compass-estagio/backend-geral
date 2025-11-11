import { Router } from 'express';
import * as controller from '../controllers/integrationController.js';
import { authenticateToken } from '../middlewares/auth.js'; 

const router = Router();

// Rota para o Frontend buscar a lista de bancos disponíveis
router.get(
  '/institutions',
  authenticateToken,
  controller.listInstitutions
);

// Rota para conectar qualquer banco
router.post(
  '/connect',
  authenticateToken, 
  controller.connectInstitution
);

 // Busca todos os saldos consolidados das contas conectadas
router.get(
  '/dashboard/accounts',
  authenticateToken,
  controller.getConsolidatedAccounts
);

export default router;