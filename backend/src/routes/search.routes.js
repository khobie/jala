import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/search.controller.js';

const router = Router();

router.get('/', ctrl.searchArtisans);
router.get('/recommend', optionalAuth, ctrl.recommend);

export default router;
