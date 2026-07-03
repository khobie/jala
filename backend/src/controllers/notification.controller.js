import { query } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listMine = asyncHandler(async (req, res) => {
  const rows = await query(
    'SELECT * FROM notifications WHERE user_id = :id ORDER BY id DESC LIMIT 100',
    { id: req.user.id }
  );
  const unread = rows.filter((r) => !r.is_read).length;
  res.json({ success: true, notifications: rows, unread });
});

export const markRead = asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :uid', {
    id: req.params.id,
    uid: req.user.id,
  });
  res.json({ success: true });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = 1 WHERE user_id = :uid', { uid: req.user.id });
  res.json({ success: true });
});
