import { query, queryOne } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { notify } from '../services/notification.service.js';

/**
 * Client creates a booking request.
 */
export const createBooking = asyncHandler(async (req, res) => {
  const { artisan_id, service_id = null, booking_date, booking_time = null, description, address = null, amount = null } = req.body;

  const artisan = await queryOne(
    'SELECT a.*, u.id AS owner_user_id, u.name FROM artisans a JOIN users u ON u.id = a.user_id WHERE a.id = :id',
    { id: artisan_id }
  );
  if (!artisan) throw ApiError.notFound('Artisan not found');
  if (!artisan.is_approved) throw ApiError.badRequest('This artisan is not yet available for booking');

  const result = await query(
    `INSERT INTO bookings (client_id, artisan_id, service_id, booking_date, booking_time, description, address, amount)
     VALUES (:clientId, :artisanId, :serviceId, :date, :time, :desc, :addr, :amount)`,
    {
      clientId: req.user.id,
      artisanId: artisan_id,
      serviceId: service_id,
      date: booking_date,
      time: booking_time,
      desc: description,
      addr: address,
      amount,
    }
  );

  await notify({
    userId: artisan.owner_user_id,
    title: 'New booking request',
    message: `${req.user.name} requested a booking for ${booking_date}.`,
    type: 'booking',
    email: true,
    sms: true,
  });

  const booking = await queryOne('SELECT * FROM bookings WHERE id = :id', { id: result.insertId });
  res.status(201).json({ success: true, message: 'Booking request sent', booking });
});

/**
 * Client: list own bookings (optionally by status).
 */
export const myBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const params = { clientId: req.user.id };
  let statusClause = '';
  if (status) {
    statusClause = 'AND b.status = :status';
    params.status = status;
  }
  const rows = await query(
    `SELECT b.*, a.trade, u.name AS artisan_name, u.avatar_url AS artisan_avatar, u.phone AS artisan_phone, a.whatsapp
     FROM bookings b
     JOIN artisans a ON a.id = b.artisan_id
     JOIN users u ON u.id = a.user_id
     WHERE b.client_id = :clientId ${statusClause}
     ORDER BY b.created_at DESC`,
    params
  );
  res.json({ success: true, bookings: rows });
});

/**
 * Artisan: list bookings made to them.
 */
export const artisanBookings = asyncHandler(async (req, res) => {
  const artisan = await queryOne('SELECT id FROM artisans WHERE user_id = :uid', { uid: req.user.id });
  if (!artisan) throw ApiError.notFound('Artisan profile not found');

  const { status } = req.query;
  const params = { artisanId: artisan.id };
  let statusClause = '';
  if (status) {
    statusClause = 'AND b.status = :status';
    params.status = status;
  }
  const rows = await query(
    `SELECT b.*, u.name AS client_name, u.avatar_url AS client_avatar, u.phone AS client_phone
     FROM bookings b JOIN users u ON u.id = b.client_id
     WHERE b.artisan_id = :artisanId ${statusClause}
     ORDER BY b.created_at DESC`,
    params
  );
  res.json({ success: true, bookings: rows });
});

const ALLOWED_TRANSITIONS = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  rejected: [],
  completed: [],
  cancelled: [],
};

/**
 * Update booking status. Artisans accept/reject/complete; clients can cancel.
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await queryOne(
    `SELECT b.*, a.user_id AS artisan_user_id FROM bookings b
     JOIN artisans a ON a.id = b.artisan_id WHERE b.id = :id`,
    { id: req.params.id }
  );
  if (!booking) throw ApiError.notFound('Booking not found');

  const isArtisan = req.user.id === booking.artisan_user_id;
  const isClient = req.user.id === booking.client_id;
  if (!isArtisan && !isClient) throw ApiError.forbidden();

  // Clients may only cancel; artisans drive the rest.
  if (isClient && !isArtisan && status !== 'cancelled') {
    throw ApiError.forbidden('Clients can only cancel bookings');
  }

  const allowed = ALLOWED_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(`Cannot change status from ${booking.status} to ${status}`);
  }

  await query('UPDATE bookings SET status = :status WHERE id = :id', { status, id: booking.id });

  // Bump artisan job count on completion.
  if (status === 'completed') {
    await query('UPDATE artisans SET jobs_completed = jobs_completed + 1 WHERE id = :id', {
      id: booking.artisan_id,
    });
  }

  // Notify the other party.
  const notifyUserId = isArtisan ? booking.client_id : booking.artisan_user_id;
  await notify({
    userId: notifyUserId,
    title: `Booking ${status}`,
    message: `Your booking #${booking.id} is now ${status}.`,
    type: 'booking',
    email: true,
  });

  const updated = await queryOne('SELECT * FROM bookings WHERE id = :id', { id: booking.id });
  res.json({ success: true, message: `Booking ${status}`, booking: updated });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await queryOne(
    `SELECT b.*, a.user_id AS artisan_user_id, a.trade,
            cu.name AS client_name, au.name AS artisan_name
     FROM bookings b
     JOIN artisans a ON a.id = b.artisan_id
     JOIN users cu ON cu.id = b.client_id
     JOIN users au ON au.id = a.user_id
     WHERE b.id = :id`,
    { id: req.params.id }
  );
  if (!booking) throw ApiError.notFound('Booking not found');
  if (req.user.role !== 'admin' && req.user.id !== booking.client_id && req.user.id !== booking.artisan_user_id) {
    throw ApiError.forbidden();
  }
  res.json({ success: true, booking });
});
