import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getRealtimeSession } from '../controllers/RealtimeController.js';

const router = Router();

router.get('/session', requireAuth, (req, res, next) => {
  getRealtimeSession(req, res).catch(next);
});

export default router;
