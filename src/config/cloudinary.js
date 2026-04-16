import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

let isConfigured = false;

export function getCloudinary() {
  if (!isConfigured) {
    if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
      throw new Error('Cloudinary credentials are required when using cloudinary storage provider.');
    }

    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
      secure: true
    });

    isConfigured = true;
  }

  return cloudinary;
}
