import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['client', 'artisan']),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  ctrl.login
);

router.get('/me', authenticate, ctrl.me);
router.post('/phone/send-otp', authenticate, ctrl.sendPhoneOtp);
router.post('/phone/verify', authenticate, [body('code').notEmpty()], validate, ctrl.verifyPhone);

router.post('/forgot-password', [body('email').isEmail()], validate, ctrl.forgotPassword);
router.post(
  '/reset-password',
  [body('email').isEmail(), body('code').notEmpty(), body('newPassword').isLength({ min: 6 })],
  validate,
  ctrl.resetPassword
);

export default router;
