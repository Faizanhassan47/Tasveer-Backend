import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { after, beforeEach, describe } from 'node:test';

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'Tasveer_Hubs-tests-'));
const tempDataDir = path.join(tempRoot, 'data');
const tempUploadDir = path.join(tempRoot, 'uploads');

process.env.NODE_ENV = 'test';
process.env.DATA_PROVIDER = 'local';
process.env.STORAGE_PROVIDER = 'local';
process.env.DATA_DIR = tempDataDir;
process.env.UPLOAD_DIR = tempUploadDir;
process.env.JWT_SECRET = 'test-secret';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const { default: app } = await import('../app.js');
const request = (await import('supertest')).default;

const api = request(app);

async function resetTestStorage() {
  await fs.rm(tempRoot, { recursive: true, force: true });
  await fs.mkdir(tempDataDir, { recursive: true });
  await fs.mkdir(tempUploadDir, { recursive: true });
  await fs.writeFile(
    path.join(tempDataDir, 'db.json'),
    JSON.stringify(
      {
        users: [],
        photos: [],
        comments: [],
        ratings: []
      },
      null,
      2
    ),
    'utf8'
  );
}

async function registerUser(payload) {
  const response = await api.post('/api/auth/register').send(payload).expect(201);
  return response.body;
}

beforeEach(async () => {
  await resetTestStorage();
});

after(async () => {
  await fs.rm(tempRoot, { recursive: true, force: true });
});

describe('Tasveer_Hubs API', () => {
  test('returns health and active provider info', async () => {
    const response = await api.get('/api/health').expect(200);

    assert.equal(response.body.status, 'ok');
    assert.equal(response.body.services.database.provider, 'local');
    assert.equal(response.body.services.storage.provider, 'local');
  });

  test('supports the creator upload and consumer interaction flow', async () => {
    const creatorSession = await registerUser({
      name: 'Casey Creator',
      email: 'creator@example.com',
      password: 'secret12',
      role: 'creator'
    });

    const consumerSession = await registerUser({
      name: 'Jordan Consumer',
      email: 'consumer@example.com',
      password: 'secret12',
      role: 'consumer'
    });

    const uploadResponse = await api
      .post('/api/photos')
      .set('Authorization', `Bearer ${creatorSession.token}`)
      .field('title', 'Festival Crowd')
      .field('caption', 'Opening set at golden hour')
      .field('location', 'Los Angeles, CA')
      .field('eventName', 'Golden Hour Fest')
      .field('tags', 'festival, crowd, sunset')
      .attach('image', Buffer.from('fake-image'), {
        filename: 'crowd.png',
        contentType: 'image/png'
      })
      .expect(201);

    assert.equal(uploadResponse.body.photo.title, 'Festival Crowd');
    assert.equal(uploadResponse.body.photo.uploadedBy.role, 'creator');
    assert.match(uploadResponse.body.photo.imageUrl, /^\/uploads\//);

    const photoId = uploadResponse.body.photo.id;

    await api
      .post(`/api/comments/photo/${photoId}`)
      .set('Authorization', `Bearer ${consumerSession.token}`)
      .send({ text: 'Great atmosphere in this shot.' })
      .expect(201);

    await api
      .post(`/api/ratings/photo/${photoId}`)
      .set('Authorization', `Bearer ${consumerSession.token}`)
      .send({ value: 5 })
      .expect(200);

    const photoDetails = await api
      .get(`/api/photos/${photoId}`)
      .set('Authorization', `Bearer ${consumerSession.token}`)
      .expect(200);

    assert.equal(photoDetails.body.photo.comments.length, 1);
    assert.equal(photoDetails.body.photo.averageRating, 5);
    assert.equal(photoDetails.body.photo.comments[0].user.role, 'consumer');

    const searchResults = await api.get('/api/photos').query({ q: 'golden hour' }).expect(200);

    assert.equal(searchResults.body.photos.length, 1);
    assert.equal(searchResults.body.photos[0].eventName, 'Golden Hour Fest');
  });
});
