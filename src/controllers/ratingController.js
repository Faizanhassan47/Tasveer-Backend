import { getRatingSummary, upsertPhotoRating } from '../services/ratingService.js';

export async function getPhotoRatings(req, res) {
  const ratings = await getRatingSummary(req.params.photoId, req.user?.id || null);
  res.json({ ratings });
}

export async function createOrUpdatePhotoRating(req, res) {
  const ratings = await upsertPhotoRating({
    photoId: req.params.photoId,
    userId: req.user.id,
    value: req.body.value
  });

  res.json({ ratings });
}
