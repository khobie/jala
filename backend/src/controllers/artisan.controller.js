import { query, queryOne } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { uploadImage } from '../services/upload.service.js';

async function getArtisanByUserId(userId) {
  return queryOne('SELECT * FROM artisans WHERE user_id = :userId', { userId });
}

async function getFullProfile(artisanId) {
  const artisan = await queryOne(
    `SELECT a.*, u.name, u.email, u.phone, u.avatar_url, u.is_phone_verified
     FROM artisans a JOIN users u ON u.id = a.user_id
     WHERE a.id = :id`,
    { id: artisanId }
  );
  if (!artisan) return null;
  const [services, portfolio, reviews] = await Promise.all([
    query('SELECT * FROM services WHERE artisan_id = :id AND is_active = 1', { id: artisanId }),
    query('SELECT * FROM portfolio_images WHERE artisan_id = :id ORDER BY id DESC', { id: artisanId }),
    query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS client_name, u.avatar_url
       FROM reviews r JOIN users u ON u.id = r.client_id
       WHERE r.artisan_id = :id AND r.is_hidden = 0
       ORDER BY r.id DESC`,
      { id: artisanId }
    ),
  ]);
  return { ...artisan, services, portfolio, reviews };
}

/** Public: list of distinct trades for filters. */
export const listTrades = asyncHandler(async (_req, res) => {
  const rows = await query(
    "SELECT trade, COUNT(*) AS count FROM artisans WHERE is_approved = 1 GROUP BY trade ORDER BY count DESC"
  );
  res.json({ success: true, trades: rows });
});

/** Public: single artisan profile. */
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getFullProfile(Number(req.params.id));
  if (!profile) throw ApiError.notFound('Artisan not found');
  res.json({ success: true, artisan: profile });
});

/** Artisan: own profile. */
export const getMyProfile = asyncHandler(async (req, res) => {
  const artisan = await getArtisanByUserId(req.user.id);
  if (!artisan) throw ApiError.notFound('Artisan profile not found');
  const profile = await getFullProfile(artisan.id);
  res.json({ success: true, artisan: profile });
});

/** Artisan: update profile fields. */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const artisan = await getArtisanByUserId(req.user.id);
  if (!artisan) throw ApiError.notFound('Artisan profile not found');

  const fields = ['trade', 'experience', 'location', 'latitude', 'longitude', 'bio', 'hourly_rate', 'availability', 'whatsapp'];
  const updates = [];
  const params = { id: artisan.id };
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = :${f}`);
      params[f] = req.body[f];
    }
  }
  if (!updates.length) throw ApiError.badRequest('No fields to update');

  await query(`UPDATE artisans SET ${updates.join(', ')} WHERE id = :id`, params);
  const profile = await getFullProfile(artisan.id);
  res.json({ success: true, message: 'Profile updated', artisan: profile });
});

/** Artisan: upload avatar. */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image uploaded');
  const { url } = await uploadImage(req.file, 'avatars');
  await query('UPDATE users SET avatar_url = :url WHERE id = :id', { url, id: req.user.id });
  res.json({ success: true, message: 'Avatar updated', avatar_url: url });
});

/** Artisan: add a portfolio image. */
export const addPortfolioImage = asyncHandler(async (req, res) => {
  const artisan = await getArtisanByUserId(req.user.id);
  if (!artisan) throw ApiError.notFound('Artisan profile not found');
  if (!req.file) throw ApiError.badRequest('No image uploaded');

  const { url } = await uploadImage(req.file, 'portfolio');
  const kind = ['before', 'after', 'general'].includes(req.body.kind) ? req.body.kind : 'general';
  const result = await query(
    'INSERT INTO portfolio_images (artisan_id, image_url, caption, kind) VALUES (:id, :url, :caption, :kind)',
    { id: artisan.id, url, caption: req.body.caption || null, kind }
  );
  res.status(201).json({
    success: true,
    image: { id: result.insertId, image_url: url, caption: req.body.caption || null, kind },
  });
});

export const deletePortfolioImage = asyncHandler(async (req, res) => {
  const artisan = await getArtisanByUserId(req.user.id);
  if (!artisan) throw ApiError.notFound('Artisan profile not found');
  await query('DELETE FROM portfolio_images WHERE id = :imgId AND artisan_id = :aid', {
    imgId: req.params.imageId,
    aid: artisan.id,
  });
  res.json({ success: true, message: 'Image removed' });
});

/* ----- Services ----- */

export const addService = asyncHandler(async (req, res) => {
  const artisan = await getArtisanByUserId(req.user.id);
  if (!artisan) throw ApiError.notFound('Artisan profile not found');
  const { service_name, description = null, price = null } = req.body;
  const result = await query(
    'INSERT INTO services (artisan_id, service_name, description, price) VALUES (:id, :name, :desc, :price)',
    { id: artisan.id, name: service_name, desc: description, price }
  );
  res.status(201).json({
    success: true,
    service: { id: result.insertId, service_name, description, price },
  });
});

export const updateService = asyncHandler(async (req, res) => {
  const artisan = await getArtisanByUserId(req.user.id);
  if (!artisan) throw ApiError.notFound('Artisan profile not found');
  const { service_name, description, price, is_active } = req.body;
  await query(
    `UPDATE services SET
       service_name = COALESCE(:name, service_name),
       description = COALESCE(:desc, description),
       price = COALESCE(:price, price),
       is_active = COALESCE(:active, is_active)
     WHERE id = :sid AND artisan_id = :aid`,
    {
      name: service_name ?? null,
      desc: description ?? null,
      price: price ?? null,
      active: is_active ?? null,
      sid: req.params.serviceId,
      aid: artisan.id,
    }
  );
  res.json({ success: true, message: 'Service updated' });
});

export const deleteService = asyncHandler(async (req, res) => {
  const artisan = await getArtisanByUserId(req.user.id);
  if (!artisan) throw ApiError.notFound('Artisan profile not found');
  await query('DELETE FROM services WHERE id = :sid AND artisan_id = :aid', {
    sid: req.params.serviceId,
    aid: artisan.id,
  });
  res.json({ success: true, message: 'Service deleted' });
});

/** Artisan: earnings dashboard. */
export const earnings = asyncHandler(async (req, res) => {
  const artisan = await getArtisanByUserId(req.user.id);
  if (!artisan) throw ApiError.notFound('Artisan profile not found');

  const stats = await queryOne(
    `SELECT
       COUNT(*) AS total_jobs,
       SUM(status = 'completed') AS completed_jobs,
       SUM(status = 'pending')   AS pending_jobs,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS total_earnings
     FROM bookings WHERE artisan_id = :id`,
    { id: artisan.id }
  );

  const monthly = await query(
    `SELECT DATE_FORMAT(updated_at, '%Y-%m') AS month,
            COALESCE(SUM(amount), 0) AS earnings,
            COUNT(*) AS jobs
     FROM bookings
     WHERE artisan_id = :id AND status = 'completed'
     GROUP BY month ORDER BY month DESC LIMIT 12`,
    { id: artisan.id }
  );

  res.json({ success: true, stats, monthly, rating: artisan.rating, rating_count: artisan.rating_count });
});
