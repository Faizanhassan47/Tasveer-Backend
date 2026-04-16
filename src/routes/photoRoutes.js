import { Router } from 'express';
import { createPhoto, getPhoto, getPhotos } from '../controllers/photoController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', optionalAuth, asyncHandler(getPhotos));
router.get('/search', optionalAuth, asyncHandler(getPhotos));
router.get('/:photoId', optionalAuth, asyncHandler(getPhoto));
router.post('/', protect, allowRoles('creator'), upload.single('image'), asyncHandler(createPhoto));

export default router;
