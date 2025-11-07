import { Router } from 'express';
import { healthCheck } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';
import integrationRoutes from './integration.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck);

// Auth routes
router.use('/auth', authRoutes);

// Integration routes
router.use('/integration', integrationRoutes);

export default router;