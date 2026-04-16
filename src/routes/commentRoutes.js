import { Router } from 'express';
import { createPhotoComment, getPhotoComments } from '../controllers/commentController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/photo/:photoId', optionalAuth, asyncHandler(getPhotoComments));
router.post('/photo/:photoId', protect, allowRoles('consumer'), asyncHandler(createPhotoComment));

export default router;
