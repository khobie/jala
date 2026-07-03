import { verifyToken } from '../utils/token.js';
import ApiError from '../utils/ApiError.js';
import { queryOne } from '../config/db.js';

/**
 * Requires a valid Bearer token. Attaches req.user.
 */
export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('Authentication token missing');

    const decoded = verifyToken(token);
    const user = await queryOne(
      'SELECT id, name, email, phone, role, is_active, is_phone_verified, avatar_url FROM users WHERE id = :id',
      { id: decoded.id }
    );
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (!user.is_active) throw ApiError.forbidden('Account is suspended');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Invalid or expired token'));
    }
    next(err);
  }
}

/**
 * Restricts a route to specific roles.
 */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}

/**
 * Optional auth: attaches req.user if a valid token is present, else continues.
 */
export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    req.user = await queryOne(
      'SELECT id, name, email, phone, role FROM users WHERE id = :id',
      { id: decoded.id }
    );
  } catch {
    /* ignore */
  }
  next();
}
