import { query } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recommendArtisans } from '../services/recommendation.service.js';

/**
 * Search & filter artisans by trade, location, minimum rating, availability.
 */
export const searchArtisans = asyncHandler(async (req, res) => {
  const { trade, location, minRating, availability, q, sort = 'rating', page = 1, limit = 12 } = req.query;

  const filters = ['a.is_approved = 1', 'u.is_active = 1'];
  const params = {};

  if (trade) {
    filters.push('a.trade = :trade');
    params.trade = trade;
  }
  if (location) {
    filters.push('a.location LIKE :location');
    params.location = `%${location}%`;
  }
  if (minRating) {
    filters.push('a.rating >= :minRating');
    params.minRating = Number(minRating);
  }
  if (availability) {
    filters.push('a.availability = :availability');
    params.availability = availability;
  }
  if (q) {
    filters.push('(u.name LIKE :q OR a.trade LIKE :q OR a.bio LIKE :q)');
    params.q = `%${q}%`;
  }

  const sortMap = {
    rating: 'a.rating DESC, a.rating_count DESC',
    experience: 'a.experience DESC',
    jobs: 'a.jobs_completed DESC',
    newest: 'a.created_at DESC',
  };
  const orderBy = sortMap[sort] || sortMap.rating;

  const perPage = Math.min(Number(limit) || 12, 50);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * perPage;

  const where = filters.join(' AND ');
  const rows = await query(
    `SELECT a.id, a.trade, a.location, a.latitude, a.longitude, a.bio,
            a.rating, a.rating_count, a.experience, a.jobs_completed,
            a.availability, a.hourly_rate, a.whatsapp,
            u.name, u.avatar_url, u.phone
     FROM artisans a JOIN users u ON u.id = a.user_id
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT ${perPage} OFFSET ${offset}`,
    params
  );

  const countRow = await query(
    `SELECT COUNT(*) AS total FROM artisans a JOIN users u ON u.id = a.user_id WHERE ${where}`,
    params
  );

  res.json({
    success: true,
    page: Number(page),
    limit: perPage,
    total: countRow[0].total,
    results: rows,
  });
});

/**
 * AI-style recommendation endpoint (explainable weighted scoring).
 */
export const recommend = asyncHandler(async (req, res) => {
  const { trade, lat, lng, limit } = req.query;
  const results = await recommendArtisans({
    clientId: req.user?.id,
    trade,
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
    limit: limit ? Number(limit) : 8,
  });
  res.json({ success: true, results });
});
