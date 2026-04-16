import { dataProvider } from '../data/dataProvider.js';
import { sanitizeUser } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';

function serializeComment(comment, database) {
  const user = database.users.find((entry) => entry.id === comment.userId);

  return {
    ...comment,
    user: sanitizeUser(user)
  };
}

function ensurePhotoExists(database, photoId) {
  const photo = database.photos.find((entry) => entry.id === photoId);

  if (!photo) {
    throw new HttpError(404, 'Photo not found.');
  }
}

export async function listCommentsByPhoto(photoId) {
  const database = await dataProvider.getPhotoGraph(photoId);
  ensurePhotoExists(database || { photos: [] }, photoId);

  return database.comments
    .filter((comment) => comment.photoId === photoId)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((comment) => serializeComment(comment, database));
}

export async function addCommentToPhoto({ photoId, userId, text }) {
  const trimmedText = String(text || '').trim();

  if (!trimmedText) {
    throw new HttpError(400, 'Comment text is required.');
  }

  const database = await dataProvider.getPhotoGraph(photoId);
  ensurePhotoExists(database || { photos: [] }, photoId);

  const comment = await dataProvider.createCommentRecord({
    photoId,
    userId,
    text: trimmedText
  });

  return serializeComment(comment, database);
}
