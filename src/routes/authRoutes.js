import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Registra um novo usuário
 * @access Public
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @desc Faz login do usuário
 * @access Public
 */
router.post('/login', login);

/**
 * @route GET /api/auth/me
 * @desc Retorna dados do usuário autenticado
 * @access Private (requer autenticação)
 */
router.get('/me', authenticateToken, getMe);

export default router;
