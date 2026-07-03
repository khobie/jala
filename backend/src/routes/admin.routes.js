import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/admin.controller.js';

const router = Router();

// All admin routes require an authenticated admin.
router.use(authenticate, authorize('admin'));

router.get('/dashboard', ctrl.dashboard);
router.get('/users', ctrl.listUsers);
router.patch('/users/:id/active', ctrl.setUserActive);

router.get('/artisans/pending', ctrl.pendingArtisans);
router.patch('/artisans/:id/approve', ctrl.approveArtisan);

router.get('/bookings', ctrl.allBookings);

router.get('/reviews', ctrl.allReviews);
router.patch('/reviews/:id/hidden', ctrl.setReviewHidden);

router.get('/reports', ctrl.reports);

export default router;
