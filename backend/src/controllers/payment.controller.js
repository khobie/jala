import { query, queryOne } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { initializePayment, verifyPayment } from '../services/payment.service.js';
import { notify } from '../services/notification.service.js';

/**
 * Client initializes a payment for a booking (MTN MoMo / Telecel / card via Paystack).
 */
export const initialize = asyncHandler(async (req, res) => {
  const { booking_id } = req.body;
  const booking = await queryOne('SELECT * FROM bookings WHERE id = :id', { id: booking_id });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.client_id !== req.user.id) throw ApiError.forbidden();
  if (!booking.amount || Number(booking.amount) <= 0) {
    throw ApiError.badRequest('This booking has no amount set yet');
  }

  const reference = `ART-${booking.id}-${Date.now()}`;
  const init = await initializePayment({
    email: req.user.email,
    amountGhs: booking.amount,
    reference,
    metadata: { booking_id: booking.id, client_id: req.user.id },
  });

  await query(
    `INSERT INTO payments (booking_id, client_id, reference, amount, provider)
     VALUES (:bookingId, :clientId, :reference, :amount, 'paystack')`,
    { bookingId: booking.id, clientId: req.user.id, reference, amount: booking.amount }
  );

  res.json({ success: true, authorization_url: init.authorization_url, reference });
});

/**
 * Verify a payment by reference (called from the callback page).
 */
export const verify = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const payment = await queryOne('SELECT * FROM payments WHERE reference = :ref', { ref: reference });
  if (!payment) throw ApiError.notFound('Payment not found');

  const result = await verifyPayment(reference);
  const status = result.status === 'success' ? 'success' : 'failed';

  await query(
    'UPDATE payments SET status = :status, channel = :channel WHERE reference = :ref',
    { status, channel: result.channel || null, ref: reference }
  );

  if (status === 'success') {
    await notify({
      userId: payment.client_id,
      title: 'Payment received',
      message: `Payment of GHS ${payment.amount} for booking #${payment.booking_id} was successful.`,
      type: 'payment',
      email: true,
    });
  }

  res.json({ success: true, status, payment: { ...payment, status } });
});
