import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/db.js';
import { sendSms } from './sms.service.js';
import ApiError from '../utils/ApiError.js';

const OTP_TTL_MINUTES = 10;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

/**
 * Creates an OTP for a user, stores its hash, and dispatches it via SMS.
 */
export async function createAndSendOtp({ userId, phone, purpose }) {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  // Invalidate previous unconsumed codes for the same purpose.
  await query(
    'UPDATE otp_codes SET consumed = 1 WHERE user_id = :userId AND purpose = :purpose AND consumed = 0',
    { userId, purpose }
  );

  await query(
    `INSERT INTO otp_codes (user_id, code_hash, purpose, expires_at)
     VALUES (:userId, :codeHash, :purpose, :expiresAt)`,
    { userId, codeHash, purpose, expiresAt }
  );

  const label = purpose === 'phone_verify' ? 'phone verification' : 'password reset';
  const result = await sendSms(phone, `Your Artisan Koforidua ${label} code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`);

  // In development (console provider, no real SMS), expose the code so the UI
  // can display it. This is NEVER returned when a real SMS provider is active.
  const devCode = result.channel === 'console' ? code : undefined;

  return { expiresInMinutes: OTP_TTL_MINUTES, devCode };
}

/**
 * Verifies an OTP code. Throws on failure, marks consumed on success.
 */
export async function verifyOtp({ userId, code, purpose }) {
  const row = await queryOne(
    `SELECT * FROM otp_codes
     WHERE user_id = :userId AND purpose = :purpose AND consumed = 0
     ORDER BY id DESC LIMIT 1`,
    { userId, purpose }
  );
  if (!row) throw ApiError.badRequest('No active code. Please request a new one.');
  if (new Date(row.expires_at) < new Date()) throw ApiError.badRequest('Code has expired.');

  const ok = await bcrypt.compare(String(code), row.code_hash);
  if (!ok) throw ApiError.badRequest('Invalid verification code.');

  await query('UPDATE otp_codes SET consumed = 1 WHERE id = :id', { id: row.id });
  return true;
}
