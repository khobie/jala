import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/payment.controller.js';

const router = Router();

router.post(
  '/initialize',
  authenticate,
  authorize('client'),
  [body('booking_id').isInt()],
  validate,
  ctrl.initialize
);
router.get('/verify/:reference', authenticate, ctrl.verify);

export default router;
