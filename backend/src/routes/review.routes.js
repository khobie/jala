import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/review.controller.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('client'),
  [
    body('booking_id').isInt(),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  ],
  validate,
  ctrl.createReview
);

router.get('/artisan/:artisanId', ctrl.artisanReviews);

export default router;
