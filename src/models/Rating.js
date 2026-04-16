import { randomUUID } from 'node:crypto';

export function createRating({ photoId, userId, value }) {
  const timestamp = new Date().toISOString();

  return {
    id: randomUUID(),
    photoId,
    userId,
    value,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
