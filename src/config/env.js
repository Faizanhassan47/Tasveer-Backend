import 'dotenv/config';
import path from 'node:path';

const backendRoot = process.cwd();

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function resolveDataProvider() {
  const explicitProvider = String(process.env.DATA_PROVIDER || '')
    .trim()
    .toLowerCase();

  if (explicitProvider === 'mongo' || explicitProvider === 'local') {
    return explicitProvider;
  }

  const uri = String(process.env.MONGODB_URI || '').trim();
  const isPlaceholder = uri.includes('<db_password>') || uri.includes('YOUR_');

  return (uri && !isPlaceholder) ? 'mongo' : 'local';
}

function resolveStorageProvider() {
  const explicitProvider = String(process.env.STORAGE_PROVIDER || '')
    .trim()
    .toLowerCase();

  if (explicitProvider === 's3' || explicitProvider === 'local' || explicitProvider === 'cloudinary') {
    return explicitProvider;
  }

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return 'cloudinary';
  }

  return process.env.AWS_S3_BUCKET && process.env.AWS_REGION ? 's3' : 'local';
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'local-dev-secret',
  dataDir: process.env.DATA_DIR || path.join(backendRoot, 'data'),
  uploadDir: process.env.UPLOAD_DIR || path.join(backendRoot, 'uploads'),
  dataProvider: resolveDataProvider(),
  storageProvider: resolveStorageProvider(),
  mongodbUri: process.env.MONGODB_URI || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  awsRegion: process.env.AWS_REGION || '',
  awsS3Bucket: process.env.AWS_S3_BUCKET || '',
  awsS3PublicBaseUrl: normalizeBaseUrl(process.env.AWS_S3_PUBLIC_BASE_URL),
  awsCloudFrontUrl: normalizeBaseUrl(process.env.AWS_CLOUDFRONT_URL),
  awsS3Endpoint: normalizeBaseUrl(process.env.AWS_S3_ENDPOINT),
  awsS3ForcePathStyle: String(process.env.AWS_S3_FORCE_PATH_STYLE || '').toLowerCase() === 'true',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  awsSessionToken: process.env.AWS_SESSION_TOKEN || ''
};
