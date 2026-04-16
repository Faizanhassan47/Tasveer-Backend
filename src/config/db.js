import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from './env.js';

let hasConnected = false;

export async function connectDatabase() {
  if (env.dataProvider !== 'mongo') {
    return {
      provider: 'local'
    };
  }

  if (hasConnected || mongoose.connection.readyState === 1) {
    return {
      provider: 'mongo',
      name: mongoose.connection.name
    };
  }

  if (!env.mongodbUri) {
    console.warn('⚠️ MONGODB_URI is missing. Falling back to local data provider.');
    return { provider: 'local' };
  }

  try {
    // Attempt to use a reliable DNS server for SRV resolution if the default fails
    if (env.mongodbUri.includes('+srv')) {
      dns.setServers(['8.8.8.8', '8.8.4.4']);
    }
    
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });
    hasConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
    return {
      provider: 'mongo',
      name: mongoose.connection.name
    };
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('👉 TIP: Check if your IP address is whitelisted in MongoDB Atlas or if your credentials are correct.');
    // We don't throw here to allow the server to start (though persistence will fail if mongo is expected)
    // In a real app, you might want to switch providers dynamically, but for now we just log.
    return { provider: 'error', error: error.message };
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  hasConnected = false;
}
