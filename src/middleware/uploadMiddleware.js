import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage =
  env.storageProvider === 'local'
    ? multer.diskStorage({
        destination(_req, _file, callback) {
          callback(null, env.uploadDir);
        },
        filename(_req, file, callback) {
          const extension = path.extname(file.originalname || '').toLowerCase();
          callback(null, `${Date.now()}-${randomUUID()}${extension}`);
        }
      })
    : multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new HttpError(400, 'Only JPG, PNG, WEBP, and GIF files are allowed.'));
      return;
    }

    callback(null, true);
  }
});

export default upload;
