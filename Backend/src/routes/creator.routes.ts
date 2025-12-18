import { Router } from 'express';
import { creatorController } from '../controllers/creator.controller';

const router = Router();

// GET /creators/by-username/:username
// Public endpoint - no authentication required
router.get('/by-username/:username', creatorController.getByUsername);

// GET /creators/search?q={query}
// Public endpoint - no authentication required
router.get('/search', creatorController.searchCreators);

// GET /creators/featured?limit=10
// Public endpoint - no authentication required
router.get('/featured', creatorController.getFeaturedCreators);

// GET /creators/:creatorId/total-tips
// Public endpoint - no authentication required
router.get('/:creatorId/total-tips', creatorController.getTotalTips);

export default router;
