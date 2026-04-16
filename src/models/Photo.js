import { randomUUID } from 'node:crypto';

export function createPhoto({ title, caption, location, eventName, tags, imageUrl, uploadedBy }) {
  return {
    id: randomUUID(),
    title: title.trim(),
    caption: String(caption || '').trim(),
    location: location.trim(),
    eventName: eventName.trim(),
    tags,
    imageUrl,
    uploadedBy,
    createdAt: new Date().toISOString()
  };
}
