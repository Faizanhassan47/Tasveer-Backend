import { createComment } from '../models/Comment.js';
import { createPhoto } from '../models/Photo.js';
import { createRating } from '../models/Rating.js';
import { createUser } from '../models/User.js';
import { ensureStorage, readDatabase, writeDatabase } from '../services/storageService.js';

function sortNewestFirst(items) {
  return [...items].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
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

function graphFromDatabase(database, photos) {
  const photoIds = new Set(photos.map((photo) => photo.id));
  const comments = sortNewestFirst(
    database.comments.filter((comment) => photoIds.has(comment.photoId))
  );
  const ratings = database.ratings.filter((rating) => photoIds.has(rating.photoId));
  const userIds = new Set([
    ...photos.map((photo) => photo.uploadedBy),
    ...comments.map((comment) => comment.userId)
  ]);
  const users = database.users.filter((user) => userIds.has(user.id));

  return {
    photos: sortNewestFirst(photos),
    comments,
    ratings,
    users
  };
}

export async function initialize() {
  await ensureStorage();
}

export async function findUserByEmail(email) {
  const database = await readDatabase();
  return database.users.find((user) => user.email === email) || null;
}

export async function findUserById(userId) {
  const database = await readDatabase();
  return database.users.find((user) => user.id === userId) || null;
}

export async function createUserRecord(input) {
  const database = await readDatabase();
  const user = createUser(input);
  database.users.push(user);
  await writeDatabase(database);
  return user;
}

export async function queryPhotoGraph({ query = '' } = {}) {
  const database = await readDatabase();
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const photos = normalizedQuery
    ? database.photos.filter((photo) => matchSearch(photo, normalizedQuery))
    : database.photos;

  return graphFromDatabase(database, photos);
}

export async function getPhotoGraph(photoId) {
  const database = await readDatabase();
  const photo = database.photos.find((entry) => entry.id === photoId);

  if (!photo) {
    return null;
  }

  return graphFromDatabase(database, [photo]);
}

export async function createPhotoRecord(input) {
  const database = await readDatabase();
  const photo = createPhoto(input);
  database.photos.push(photo);
  await writeDatabase(database);
  return photo;
}

export async function createCommentRecord(input) {
  const database = await readDatabase();
  const comment = createComment(input);
  database.comments.push(comment);
  await writeDatabase(database);
  return comment;
}

export async function upsertRatingRecord(input) {
  const database = await readDatabase();
  const existingRating = database.ratings.find(
    (rating) => rating.photoId === input.photoId && rating.userId === input.userId
  );

  if (existingRating) {
    existingRating.value = input.value;
    existingRating.updatedAt = new Date().toISOString();
    await writeDatabase(database);
    return existingRating;
  }

  const rating = createRating(input);
  database.ratings.push(rating);
  await writeDatabase(database);
  return rating;
}
