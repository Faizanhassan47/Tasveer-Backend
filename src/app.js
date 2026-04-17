import mongoose from 'mongoose';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import photoRoutes from './routes/photoRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { env } from './config/env.js';
import { usesLocalUploads } from './storage/objectStorage.js';

const app = express();

// Global CORS - Allow all origins
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (usesLocalUploads()) {
  app.use('/uploads', express.static(env.uploadDir));
}

app.get('/api/health', async (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const uptime = process.uptime();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    services: {
      database: {
        provider: env.dataProvider,
        status: dbStatus,
        latency: dbStatus === 'connected' ? 'stable' : 'n/a'
      },
      storage: {
        provider: env.storageProvider,
        status: env.storageProvider === 'cloudinary' && !env.cloudinary.apiKey ? 'error' : 'active',
        config: env.storageProvider === 'cloudinary' ? 'cloud-configured' : 'local-configured'
      }
    },
    environment: env.nodeEnv,
    version: '2.5.0-ultra-premium'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;