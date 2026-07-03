import { query, queryOne } from '../config/db.js';
import { sendEmail } from './email.service.js';
import { sendSms } from './sms.service.js';

/**
 * Creates an in-app notification and optionally fans out to email / SMS.
 */
export async function notify({ userId, title, message, type = 'general', email = false, sms = false }) {
  await query(
    'INSERT INTO notifications (user_id, title, message, type) VALUES (:userId, :title, :message, :type)',
    { userId, title, message, type }
  );

  if (email || sms) {
    const user = await queryOne('SELECT email, phone FROM users WHERE id = :id', { id: userId });
    if (user) {
      if (email) {
        sendEmail({
          to: user.email,
          subject: title,
          text: message,
          html: `<p>${message}</p>`,
        }).catch(() => {});
      }
      if (sms) {
        sendSms(user.phone, `${title}: ${message}`).catch(() => {});
      }
    }
  }
}
