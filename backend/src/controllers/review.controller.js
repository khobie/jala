import { query, queryOne } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { notify } from '../services/notification.service.js';

/**
 * Recompute an artisan's average rating from visible reviews.
 */
async function recomputeRating(artisanId) {
  const row = await queryOne(
    `SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS cnt
     FROM reviews WHERE artisan_id = :id AND is_hidden = 0`,
    { id: artisanId }
  );
  await query('UPDATE artisans SET rating = :avg, rating_count = :cnt WHERE id = :id', {
    avg: Number(row.avg_rating).toFixed(2),
    cnt: row.cnt,
    id: artisanId,
  });
}

/**
 * Client leaves a review for a completed booking.
 */
export const createReview = asyncHandler(async (req, res) => {
  const { booking_id, rating, comment = null } = req.body;

  const booking = await queryOne('SELECT * FROM bookings WHERE id = :id', { id: booking_id });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.client_id !== req.user.id) throw ApiError.forbidden('You can only review your own bookings');
  if (booking.status !== 'completed') throw ApiError.badRequest('You can only review completed bookings');

  const existing = await queryOne('SELECT id FROM reviews WHERE booking_id = :id', { id: booking_id });
  if (existing) throw ApiError.conflict('You have already reviewed this booking');

  await query(
    `INSERT INTO reviews (booking_id, client_id, artisan_id, rating, comment)
     VALUES (:bookingId, :clientId, :artisanId, :rating, :comment)`,
    { bookingId: booking_id, clientId: req.user.id, artisanId: booking.artisan_id, rating, comment }
  );

  await recomputeRating(booking.artisan_id);

  const artisan = await queryOne('SELECT user_id FROM artisans WHERE id = :id', { id: booking.artisan_id });
  await notify({
    userId: artisan.user_id,
    title: 'New review received',
    message: `You received a ${rating}-star review.`,
    type: 'review',
  });

  res.status(201).json({ success: true, message: 'Review submitted' });
});

/** Public: reviews for an artisan. */
export const artisanReviews = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS client_name, u.avatar_url
     FROM reviews r JOIN users u ON u.id = r.client_id
     WHERE r.artisan_id = :id AND r.is_hidden = 0
     ORDER BY r.id DESC`,
    { id: req.params.artisanId }
  );
  res.json({ success: true, reviews: rows });
});
