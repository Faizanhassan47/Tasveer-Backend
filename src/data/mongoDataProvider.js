import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { CommentModel, PhotoModel, RatingModel, UserModel } from './mongoModels.js';

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function serializeRecord(record) {
  if (!record) {
    return null;
  }

  const plain = typeof record.toObject === 'function' ? record.toObject() : record;
  const serialized = {
    ...plain,
    id: String(plain._id)
  };

  delete serialized._id;
  delete serialized.__v;

  for (const key of ['uploadedBy', 'photoId', 'userId']) {
    if (serialized[key]) {
      serialized[key] = String(serialized[key]);
    }
  }

  return serialized;
}

function serializeMany(records) {
  return records.map((record) => serializeRecord(record));
}

function buildSearchFilter(query) {
  const normalizedQuery = String(query || '').trim();

  if (!normalizedQuery) {
    return {};
  }

  const regex = new RegExp(escapeRegExp(normalizedQuery), 'i');

  return {
    $or: [
      { title: regex },
      { caption: regex },
      { location: regex },
      { eventName: regex },
      { tags: regex }
    ]
  };
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

export async function initialize() {
  await connectDatabase();
}

export async function findUserByEmail(email) {
  await connectDatabase();
  const user = await UserModel.findOne({ email }).lean();
  return serializeRecord(user);
}

export async function findUserById(userId) {
  await connectDatabase();

  if (!isValidObjectId(userId)) {
    return null;
  }

  const user = await UserModel.findById(userId).lean();
  return serializeRecord(user);
}

export async function createUserRecord(input) {
  await connectDatabase();
  const user = await UserModel.create(input);
  return serializeRecord(user);
}

export async function queryPhotoGraph({ query = '', sort = 'newest', page = 1, limit = 12 } = {}) {
  await connectDatabase();

  const skip = (Math.max(1, page) - 1) * limit;
  const sortOptions = {};

  if (sort === 'rating') {
    sortOptions.averageRating = -1;
    sortOptions.createdAt = -1;
  } else {
    sortOptions.createdAt = -1;
  }

  const photos = await PhotoModel.find(buildSearchFilter(query))
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();

  const photoIds = photos.map((photo) => photo._id);
  const comments = photoIds.length
    ? await CommentModel.find({ photoId: { $in: photoIds } }).sort({ createdAt: -1 }).lean()
    : [];
  const ratings = photoIds.length
    ? await RatingModel.find({ photoId: { $in: photoIds } }).lean()
    : [];
  const userIds = uniqueStrings([
    ...photos.map((photo) => photo.uploadedBy),
    ...comments.map((comment) => comment.userId)
  ]);
  const users = userIds.length ? await UserModel.find({ _id: { $in: userIds } }).lean() : [];

  return {
    photos: serializeMany(photos),
    comments: serializeMany(comments),
    ratings: serializeMany(ratings),
    users: serializeMany(users)
  };
}

export async function getPhotoGraph(photoId) {
  await connectDatabase();

  if (!isValidObjectId(photoId)) {
    return null;
  }

  const photo = await PhotoModel.findById(photoId).lean();

  if (!photo) {
    return null;
  }

  const [comments, ratings] = await Promise.all([
    CommentModel.find({ photoId: photo._id }).sort({ createdAt: -1 }).lean(),
    RatingModel.find({ photoId: photo._id }).lean()
  ]);
  const userIds = uniqueStrings([photo.uploadedBy, ...comments.map((comment) => comment.userId)]);
  const users = userIds.length ? await UserModel.find({ _id: { $in: userIds } }).lean() : [];

  return {
    photos: serializeMany([photo]),
    comments: serializeMany(comments),
    ratings: serializeMany(ratings),
    users: serializeMany(users)
  };
}

export async function createPhotoRecord(input) {
  await connectDatabase();
  const photo = await PhotoModel.create(input);
  return serializeRecord(photo);
}

export async function createCommentRecord(input) {
  await connectDatabase();
  const comment = await CommentModel.create(input);
  return serializeRecord(comment);
}

export async function upsertRatingRecord({ photoId, userId, value }) {
  await connectDatabase();

  const rating = await RatingModel.findOneAndUpdate(
    { photoId, userId },
    { $set: { value } },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  // Denormalize: Recalculate average rating for the photo
  const stats = await RatingModel.aggregate([
    { $match: { photoId: new mongoose.Types.ObjectId(photoId) } },
    {
      $group: {
        _id: '$photoId',
        averageRating: { $avg: '$value' },
        ratingsCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length) {
    await PhotoModel.findByIdAndUpdate(photoId, {
      averageRating: Number(stats[0].averageRating.toFixed(1)),
      ratingsCount: stats[0].ratingsCount
    });
  }

  return serializeRecord(rating);
}
