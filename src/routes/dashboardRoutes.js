import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

/**
 * @route GET /api/dashboard
 * @desc Retorna dados consolidados do dashboard (gráficos de alocação e sugestões)
 * @access Private (requer autenticação)
 */
router.get('/', authenticateToken, getDashboardData);

export default router;