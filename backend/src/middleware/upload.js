import multer from 'multer';
import ApiError from '../utils/ApiError.js';

// Keep files in memory; we stream them to Cloudinary (or persist locally as fallback).
const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only image files are allowed'));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;
