import { Router } from 'express';
import { healthCheck } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck);

// Auth routes
router.use('/auth', authRoutes);

export default router;