import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/booking.controller.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('client'),
  [
    body('artisan_id').isInt().withMessage('artisan_id is required'),
    body('booking_date').notEmpty().withMessage('booking_date is required'),
    body('description').trim().notEmpty().withMessage('description is required'),
  ],
  validate,
  ctrl.createBooking
);

router.get('/me', authenticate, authorize('client'), ctrl.myBookings);
router.get('/artisan', authenticate, authorize('artisan'), ctrl.artisanBookings);
router.get('/:id', authenticate, ctrl.getBooking);
router.patch(
  '/:id/status',
  authenticate,
  [body('status').isIn(['accepted', 'rejected', 'completed', 'cancelled'])],
  validate,
  ctrl.updateStatus
);

export default router;
