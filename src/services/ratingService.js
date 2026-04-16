import { dataProvider } from '../data/dataProvider.js';
import { HttpError } from '../utils/httpError.js';
import { parseRatingValue } from '../utils/validators.js';

function ensurePhotoExists(database, photoId) {
  const photo = database.photos.find((entry) => entry.id === photoId);

  if (!photo) {
    throw new HttpError(404, 'Photo not found.');
  }
}

function calculateSummary(database, photoId, viewerId = null) {
  const ratings = database.ratings.filter((entry) => entry.photoId === photoId);
  const total = ratings.reduce((sum, rating) => sum + rating.value, 0);
  const averageRating = ratings.length ? Number((total / ratings.length).toFixed(1)) : null;

  return {
    averageRating,
    ratingsCount: ratings.length,
    viewerRating: viewerId
      ? ratings.find((entry) => entry.userId === viewerId)?.value ?? null
      : null,
    distribution: [1, 2, 3, 4, 5].map((value) => ({
      value,
      count: ratings.filter((entry) => entry.value === value).length
    }))
  };
}

export async function getRatingSummary(photoId, viewerId = null) {
  const database = await dataProvider.getPhotoGraph(photoId);
  ensurePhotoExists(database || { photos: [] }, photoId);
  return calculateSummary(database, photoId, viewerId);
}

export async function upsertPhotoRating({ photoId, userId, value }) {
  const parsedValue = parseRatingValue(value);

  if (!parsedValue) {
    throw new HttpError(400, 'Rating must be a whole number between 1 and 5.');
  }

  const database = await dataProvider.getPhotoGraph(photoId);
  ensurePhotoExists(database || { photos: [] }, photoId);

  await dataProvider.upsertRatingRecord({
    photoId,
    userId,
    value: parsedValue
  });

  const nextDatabase = await dataProvider.getPhotoGraph(photoId);

  return calculateSummary(nextDatabase, photoId, userId);
}
