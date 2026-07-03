import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!env.smtp.enabled) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

/**
 * Sends an email. In development without SMTP configured, logs to console.
 */
export async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`\n[EMAIL:console] To: ${to}\nSubject: ${subject}\n${text || html}\n`);
    return { delivered: false, channel: 'console' };
  }
  await t.sendMail({ from: env.smtp.from, to, subject, html, text });
  return { delivered: true, channel: 'smtp' };
}
