import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import { getCloudinary } from '../config/cloudinary.js';
import { getS3Client } from '../config/s3.js';
import { ensureStorage } from '../services/storageService.js';
import { HttpError } from '../utils/httpError.js';

function slugifyFileStem(value) {
  return String(value || 'photo')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function buildObjectKey(file) {
  const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
  const stem = slugifyFileStem(file.originalname);
  return `photos/${Date.now()}-${stem || 'photo'}-${randomUUID()}${extension}`;
}

function resolveS3PublicUrl(key) {
  if (env.awsCloudFrontUrl) {
    return `${env.awsCloudFrontUrl}/${key}`;
  }

  if (env.awsS3PublicBaseUrl) {
    return `${env.awsS3PublicBaseUrl}/${key}`;
  }

  if (env.awsS3Endpoint) {
    return `${env.awsS3Endpoint}/${env.awsS3Bucket}/${key}`;
  }

  return `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;
}

export async function ensureObjectStorage() {
  if (env.storageProvider === 'local') {
    await ensureStorage();
    return;
  }

  if (env.storageProvider === 's3') {
    getS3Client();
  }
}

export function usesLocalUploads() {
  return env.storageProvider === 'local';
}

async function uploadToCloudinary(file) {
  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'Tasveer_Hubs',
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        overwrite: false
      },
      (error, result) => {
        if (error) {
          return reject(new HttpError(500, `Cloudinary upload failed: ${error.message}`));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(file.buffer);
  });
}

export async function persistUploadedFile(file) {
  if (!file) {
    throw new HttpError(400, 'Please upload an image file.');
  }

  if (env.storageProvider === 'local') {
    if (!file.filename) {
      throw new Error('Local uploads require a disk-backed file from Multer.');
    }

    return `/uploads/${file.filename}`;
  }

  if (env.storageProvider === 'cloudinary') {
    if (!file.buffer) {
      throw new Error('Cloudinary uploads require a memory-backed file buffer.');
    }

    return uploadToCloudinary(file);
  }

  if (!file.buffer) {
    throw new Error('S3 uploads require a memory-backed file buffer.');
  }

  const key = buildObjectKey(file);
  const s3 = getS3Client();

  await s3.send(
    new PutObjectCommand({
      Bucket: env.awsS3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000, immutable'
    })
  );

  return resolveS3PublicUrl(key);
}
