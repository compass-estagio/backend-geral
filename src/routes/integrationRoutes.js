import { Router } from 'express';
import * as controller from '../controllers/integration.controller.js';
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

export default router;