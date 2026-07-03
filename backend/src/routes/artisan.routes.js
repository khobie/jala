import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import * as ctrl from '../controllers/artisan.controller.js';

const router = Router();

// Public
router.get('/trades', ctrl.listTrades);

// Artisan self-service (specific routes before :id)
router.get('/me/profile', authenticate, authorize('artisan'), ctrl.getMyProfile);
router.put('/me/profile', authenticate, authorize('artisan'), ctrl.updateMyProfile);
router.get('/me/earnings', authenticate, authorize('artisan'), ctrl.earnings);
router.post('/me/avatar', authenticate, authorize('artisan'), upload.single('image'), ctrl.uploadAvatar);

router.post('/me/portfolio', authenticate, authorize('artisan'), upload.single('image'), ctrl.addPortfolioImage);
router.delete('/me/portfolio/:imageId', authenticate, authorize('artisan'), ctrl.deletePortfolioImage);

router.post(
  '/me/services',
  authenticate,
  authorize('artisan'),
  [body('service_name').trim().notEmpty()],
  validate,
  ctrl.addService
);
router.put('/me/services/:serviceId', authenticate, authorize('artisan'), ctrl.updateService);
router.delete('/me/services/:serviceId', authenticate, authorize('artisan'), ctrl.deleteService);

// Public profile (keep last)
router.get('/:id', ctrl.getProfile);

export default router;
