import { Router } from 'express';
import {
  createOrUpdatePhotoRating,
  getPhotoRatings
} from '../controllers/ratingController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/photo/:photoId', optionalAuth, asyncHandler(getPhotoRatings));
router.post('/photo/:photoId', protect, allowRoles('consumer'), asyncHandler(createOrUpdatePhotoRating));

export default router;
