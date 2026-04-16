import { randomUUID } from 'node:crypto';

export function createComment({ photoId, userId, text }) {
  return {
    id: randomUUID(),
    photoId,
    userId,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };
}
