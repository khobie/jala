import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Collects express-validator errors and throws a 400 with details.
 */
export default function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  next();
}
