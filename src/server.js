import app from './app.js';
import { env } from './config/env.js';
import { dataProvider } from './data/dataProvider.js';
import { ensureStorage } from './services/storageService.js';
import { ensureObjectStorage, usesLocalUploads } from './storage/objectStorage.js';

async function start() {
  try {
    console.log('Starting Tasveer_Hubs backend...');
    console.log(`NODE_ENV: ${env.nodeEnv}`);
    console.log(`PORT: ${env.port}`);
    console.log(`Data provider: ${env.dataProvider}`);
    console.log(`Storage provider: ${env.storageProvider}`);

    await dataProvider.initialize();
    console.log('Data provider initialized successfully.');

    if (env.dataProvider === 'local' || usesLocalUploads()) {
      await ensureStorage();
      console.log('Local storage ensured.');
    }

    await ensureObjectStorage();
    console.log('Object storage ensured.');

    const server = app.listen(env.port, '0.0.0.0', () => {
      console.log(`Tasveer_Hubs backend listening on port ${env.port}`);
      console.log(`Health endpoint available at /api/health`);
    });

    server.on('error', (error) => {
      console.error('Server failed while starting:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start the backend server.', error);
    process.exit(1);
  }
}

start();