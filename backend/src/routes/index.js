import { Router } from 'express';
import env from '../config/env.js';
import { getDbTarget } from '../config/dbConfig.js';
import { testConnection } from '../config/db.js';
import authRoutes from './auth.routes.js';
import artisanRoutes from './artisan.routes.js';
import searchRoutes from './search.routes.js';
import bookingRoutes from './booking.routes.js';
import reviewRoutes from './review.routes.js';
import notificationRoutes from './notification.routes.js';
import paymentRoutes from './payment.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

router.get('/health/db', async (_req, res) => {
  const target = getDbTarget();
  try {
    await testConnection();
    res.json({ success: true, status: 'connected', target });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'disconnected',
      message: err.message,
      code: err.code || null,
      target,
    });
  }
});

// Public runtime config consumed by the frontend (e.g. Google Maps key, Paystack public key).
router.get('/config', (_req, res) =>
  res.json({
    success: true,
    googleMapsApiKey: env.googleMapsApiKey || null,
    paystackPublicKey: env.paystack.publicKey || null,
    paymentsEnabled: env.paystack.enabled,
  })
);

router.use('/auth', authRoutes);
router.use('/artisans', artisanRoutes);
router.use('/search', searchRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

export default router;
