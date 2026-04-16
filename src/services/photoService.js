import { dataProvider } from '../data/dataProvider.js';
import { sanitizeUser } from '../models/User.js';
import { persistUploadedFile } from '../storage/objectStorage.js';
import { HttpError } from '../utils/httpError.js';
import { parseTags } from '../utils/validators.js';

function sortNewestFirst(items) {
  return [...items].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function calculateAverageRating(ratings) {
  if (!ratings.length) {
    return null;
  }

  const total = ratings.reduce((sum, rating) => sum + rating.value, 0);
  return Number((total / ratings.length).toFixed(1));
}

function serializeComment(comment, database) {
  const user = database.users.find((entry) => entry.id === comment.userId);

  return {
    ...comment,
    user: sanitizeUser(user)
  };
}

function serializePhoto(photo, database, viewerId = null) {
  const uploader = database.users.find((entry) => entry.id === photo.uploadedBy);
  const comments = database.comments.filter((entry) => entry.photoId === photo.id);
  const ratings = database.ratings.filter((entry) => entry.photoId === photo.id);
  const viewerRating = viewerId
    ? ratings.find((entry) => entry.userId === viewerId)?.value ?? null
    : null;

  return {
    ...photo,
    uploadedBy: sanitizeUser(uploader),
    commentsCount: comments.length,
    ratingsCount: ratings.length,
    averageRating: calculateAverageRating(ratings),
    viewerRating
  };
}

function matchSearch(photo, query) {
  const haystack = [
    photo.title,
    photo.caption,
    photo.location,
    photo.eventName,
    ...(photo.tags || [])
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

export async function listPhotos({ query = '', sort = 'newest', page = 1, limit = 12, viewerId = null } = {}) {
  const database = await dataProvider.queryPhotoGraph({
    query,
    sort,
    page,
    limit
  });

  return database.photos.map((photo) => serializePhoto(photo, database, viewerId));
}

export async function getPhotoById(photoId, viewerId = null) {
  const database = await dataProvider.getPhotoGraph(photoId);
  const photo = database?.photos?.find((entry) => entry.id === photoId);

  if (!photo) {
    throw new HttpError(404, 'Photo not found.');
  }

  const details = serializePhoto(photo, database, viewerId);
  const comments = database.comments
    .filter((entry) => entry.photoId === photoId)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((comment) => serializeComment(comment, database));

  return {
    ...details,
    comments
  };
}

export async function createNewPhoto({ title, caption, location, eventName, tags, file, userId }) {
  const trimmedTitle = String(title || '').trim();
  const trimmedLocation = String(location || '').trim();
  const trimmedEventName = String(eventName || '').trim();

  if (!trimmedTitle || !trimmedLocation || !trimmedEventName) {
    throw new HttpError(400, 'Title, location, and event name are required.');
  }

  if (!file) {
    throw new HttpError(400, 'Please upload an image file.');
  }

  const imageUrl = await persistUploadedFile(file);
  const photo = await dataProvider.createPhotoRecord({
    title: trimmedTitle,
    caption,
    location: trimmedLocation,
    eventName: trimmedEventName,
    tags: parseTags(tags),
    imageUrl,
    uploadedBy: userId
  });
  const database = await dataProvider.getPhotoGraph(photo.id);

  return serializePhoto(photo, database, userId);
}
