import app from './app.js';
import { env } from './config/env.js';
import { dataProvider } from './data/dataProvider.js';
import { ensureStorage } from './services/storageService.js';
import { ensureObjectStorage, usesLocalUploads } from './storage/objectStorage.js';

async function start() {
  await dataProvider.initialize();

  if (env.dataProvider === 'local' || usesLocalUploads()) {
    await ensureStorage();
  }

  await ensureObjectStorage();

  app.listen(env.port, () => {
    console.log(`Tasveer_Hubs backend listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start the backend server.', error);
  process.exit(1);
});
