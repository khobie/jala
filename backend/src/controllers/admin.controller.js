import { query, queryOne } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { notify } from '../services/notification.service.js';

/** Dashboard statistics. */
export const dashboard = asyncHandler(async (_req, res) => {
  const [counts] = await query(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE role = 'client')  AS total_clients,
       (SELECT COUNT(*) FROM artisans)                     AS total_artisans,
       (SELECT COUNT(*) FROM artisans WHERE is_approved=0)  AS pending_artisans,
       (SELECT COUNT(*) FROM bookings)                     AS total_bookings,
       (SELECT COUNT(*) FROM bookings WHERE status='completed') AS completed_bookings,
       (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='success') AS revenue`
  );

  const bookingsByStatus = await query(
    'SELECT status, COUNT(*) AS count FROM bookings GROUP BY status'
  );
  const recentBookings = await query(
    `SELECT b.id, b.status, b.booking_date, b.amount,
            cu.name AS client_name, au.name AS artisan_name, a.trade
     FROM bookings b
     JOIN users cu ON cu.id = b.client_id
     JOIN artisans a ON a.id = b.artisan_id
     JOIN users au ON au.id = a.user_id
     ORDER BY b.id DESC LIMIT 10`
  );

  res.json({ success: true, stats: counts, bookingsByStatus, recentBookings });
});

/** List users (filter by role). */
export const listUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const params = {};
  let clause = '';
  if (role) {
    clause = 'WHERE role = :role';
    params.role = role;
  }
  const rows = await query(
    `SELECT id, name, email, phone, role, is_active, is_phone_verified, created_at
     FROM users ${clause} ORDER BY id DESC`,
    params
  );
  res.json({ success: true, users: rows });
});

/** Pending artisan approvals. */
export const pendingArtisans = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT a.id, a.trade, a.location, a.experience, a.created_at,
            u.name, u.email, u.phone, u.is_phone_verified
     FROM artisans a JOIN users u ON u.id = a.user_id
     WHERE a.is_approved = 0 ORDER BY a.id DESC`
  );
  res.json({ success: true, artisans: rows });
});

export const approveArtisan = asyncHandler(async (req, res) => {
  const artisan = await queryOne('SELECT * FROM artisans WHERE id = :id', { id: req.params.id });
  if (!artisan) throw ApiError.notFound('Artisan not found');
  await query('UPDATE artisans SET is_approved = 1 WHERE id = :id', { id: artisan.id });
  await notify({
    userId: artisan.user_id,
    title: 'Profile approved',
    message: 'Your artisan profile has been approved. Clients can now book you.',
    type: 'system',
    email: true,
    sms: true,
  });
  res.json({ success: true, message: 'Artisan approved' });
});

/** Suspend / reactivate a user account. */
export const setUserActive = asyncHandler(async (req, res) => {
  const { is_active } = req.body;
  const user = await queryOne('SELECT id, role FROM users WHERE id = :id', { id: req.params.id });
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'admin') throw ApiError.badRequest('Cannot modify an admin account');
  await query('UPDATE users SET is_active = :active WHERE id = :id', {
    active: is_active ? 1 : 0,
    id: user.id,
  });
  res.json({ success: true, message: is_active ? 'Account reactivated' : 'Account suspended' });
});

/** All bookings (monitoring). */
export const allBookings = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT b.*, cu.name AS client_name, au.name AS artisan_name, a.trade
     FROM bookings b
     JOIN users cu ON cu.id = b.client_id
     JOIN artisans a ON a.id = b.artisan_id
     JOIN users au ON au.id = a.user_id
     ORDER BY b.id DESC LIMIT 200`
  );
  res.json({ success: true, bookings: rows });
});

/** Reviews moderation. */
export const allReviews = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT r.*, cu.name AS client_name, au.name AS artisan_name
     FROM reviews r
     JOIN users cu ON cu.id = r.client_id
     JOIN artisans a ON a.id = r.artisan_id
     JOIN users au ON au.id = a.user_id
     ORDER BY r.id DESC LIMIT 200`
  );
  res.json({ success: true, reviews: rows });
});

export const setReviewHidden = asyncHandler(async (req, res) => {
  const { is_hidden } = req.body;
  const review = await queryOne('SELECT * FROM reviews WHERE id = :id', { id: req.params.id });
  if (!review) throw ApiError.notFound('Review not found');
  await query('UPDATE reviews SET is_hidden = :hidden WHERE id = :id', {
    hidden: is_hidden ? 1 : 0,
    id: review.id,
  });
  // Recompute affected artisan rating.
  const agg = await queryOne(
    'SELECT COALESCE(AVG(rating),0) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE artisan_id = :id AND is_hidden = 0',
    { id: review.artisan_id }
  );
  await query('UPDATE artisans SET rating = :avg, rating_count = :cnt WHERE id = :id', {
    avg: Number(agg.avg_rating).toFixed(2),
    cnt: agg.cnt,
    id: review.artisan_id,
  });
  res.json({ success: true, message: is_hidden ? 'Review hidden' : 'Review restored' });
});

/** Reports: top artisans, top trades, monthly bookings. */
export const reports = asyncHandler(async (_req, res) => {
  const topArtisans = await query(
    `SELECT a.id, u.name, a.trade, a.rating, a.jobs_completed,
            COUNT(b.id) AS bookings
     FROM artisans a
     JOIN users u ON u.id = a.user_id
     LEFT JOIN bookings b ON b.artisan_id = a.id
     GROUP BY a.id ORDER BY bookings DESC, a.rating DESC LIMIT 10`
  );
  const topTrades = await query(
    `SELECT a.trade, COUNT(b.id) AS bookings
     FROM bookings b JOIN artisans a ON a.id = b.artisan_id
     GROUP BY a.trade ORDER BY bookings DESC`
  );
  const monthlyBookings = await query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS bookings
     FROM bookings GROUP BY month ORDER BY month DESC LIMIT 12`
  );
  res.json({ success: true, topArtisans, topTrades, monthlyBookings });
});
