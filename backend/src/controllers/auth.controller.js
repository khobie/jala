import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/db.js';
import { signToken } from '../utils/token.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { createAndSendOtp, verifyOtp } from '../services/otp.service.js';
import { notify } from '../services/notification.service.js';

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    avatar_url: u.avatar_url || null,
    is_phone_verified: !!u.is_phone_verified,
  };
}

/**
 * Register a client or artisan. Artisans also get an artisan profile row
 * and start unapproved (pending admin approval).
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = 'client' } = req.body;

  if (!['client', 'artisan'].includes(role)) {
    throw ApiError.badRequest('Role must be client or artisan');
  }

  const existing = await queryOne('SELECT id FROM users WHERE email = :email', { email });
  if (existing) throw ApiError.conflict('Email is already registered');

  const hash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO users (name, email, phone, password, role) VALUES (:name, :email, :phone, :password, :role)',
    { name, email, phone, password: hash, role }
  );
  const userId = result.insertId;

  if (role === 'artisan') {
    const { trade, experience = 0, location, bio = null } = req.body;
    if (!trade || !location) {
      throw ApiError.badRequest('Artisans must provide a trade and location');
    }
    await query(
      `INSERT INTO artisans (user_id, trade, experience, location, bio, whatsapp)
       VALUES (:userId, :trade, :experience, :location, :bio, :whatsapp)`,
      { userId, trade, experience, location, bio, whatsapp: phone }
    );
  }

  // Fire phone verification OTP (non-blocking failures are fine in dev).
  let devCode;
  try {
    ({ devCode } = await createAndSendOtp({ userId, phone, purpose: 'phone_verify' }));
  } catch {
    /* ignore in dev */
  }

  const user = await queryOne('SELECT * FROM users WHERE id = :id', { id: userId });
  const token = signToken({ id: userId, role });

  res.status(201).json({
    success: true,
    message: 'Registration successful. A verification code was sent to your phone.',
    token,
    user: publicUser(user),
    devCode,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await queryOne('SELECT * FROM users WHERE email = :email', { email });
  if (!user) throw ApiError.unauthorized('Invalid email or password');
  if (!user.is_active) throw ApiError.forbidden('Your account has been suspended');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  const token = signToken({ id: user.id, role: user.role });
  res.json({ success: true, token, user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await queryOne('SELECT * FROM users WHERE id = :id', { id: req.user.id });
  let artisan = null;
  if (user.role === 'artisan') {
    artisan = await queryOne('SELECT * FROM artisans WHERE user_id = :id', { id: user.id });
  }
  res.json({ success: true, user: publicUser(user), artisan });
});

export const sendPhoneOtp = asyncHandler(async (req, res) => {
  const { devCode } = await createAndSendOtp({
    userId: req.user.id,
    phone: req.user.phone,
    purpose: 'phone_verify',
  });
  res.json({ success: true, message: 'Verification code sent', devCode });
});

export const verifyPhone = asyncHandler(async (req, res) => {
  const { code } = req.body;
  await verifyOtp({ userId: req.user.id, code, purpose: 'phone_verify' });
  await query('UPDATE users SET is_phone_verified = 1 WHERE id = :id', { id: req.user.id });
  res.json({ success: true, message: 'Phone number verified' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await queryOne('SELECT * FROM users WHERE email = :email', { email });
  // Always respond success to avoid leaking which emails exist.
  let devCode;
  if (user) {
    ({ devCode } = await createAndSendOtp({ userId: user.id, phone: user.phone, purpose: 'password_reset' }));
    await notify({
      userId: user.id,
      title: 'Password reset requested',
      message: 'A password reset code was sent to your phone.',
      type: 'system',
      email: true,
    });
  }
  res.json({ success: true, message: 'If the account exists, a reset code has been sent.', devCode });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await queryOne('SELECT * FROM users WHERE email = :email', { email });
  if (!user) throw ApiError.badRequest('Invalid request');

  await verifyOtp({ userId: user.id, code, purpose: 'password_reset' });
  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password = :hash WHERE id = :id', { hash, id: user.id });
  res.json({ success: true, message: 'Password reset successful. You can now log in.' });
});
