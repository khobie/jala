import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

/**
 * Uploads an in-memory image buffer.
 * Uses Cloudinary when configured, otherwise falls back to local disk
 * (served statically at /uploads) so the app still works in development.
 *
 * @returns {Promise<{url: string, publicId: string|null}>}
 */
export async function uploadImage(file, folder = 'artisan') {
  if (!file || !file.buffer) {
    throw new Error('No file provided');
  }

  if (env.cloudinary.enabled) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `artisan_koforidua/${folder}`, resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(file.buffer);
    });
  }

  // Local fallback
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const filename = `${folder}_${Date.now()}_${Math.round(Math.random() * 1e6)}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, file.buffer);
  return { url: `/uploads/${filename}`, publicId: null };
}

export async function deleteImage(publicId) {
  if (publicId && env.cloudinary.enabled) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      /* best-effort */
    }
  }
}
