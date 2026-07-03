import axios from 'axios';
import env from '../config/env.js';

/**
 * Sends an SMS via the configured provider.
 * Providers: hubtel | twilio | console (logs to console for dev).
 */
export async function sendSms(to, message) {
  const provider = env.sms.provider;

  try {
    if (provider === 'hubtel' && env.sms.hubtel.clientId) {
      const auth = Buffer.from(
        `${env.sms.hubtel.clientId}:${env.sms.hubtel.clientSecret}`
      ).toString('base64');
      await axios.post(
        'https://smsc.hubtel.com/v1/messages/send',
        { From: env.sms.hubtel.senderId, To: to, Content: message },
        { headers: { Authorization: `Basic ${auth}` } }
      );
      return { delivered: true, channel: 'hubtel' };
    }

    if (provider === 'twilio' && env.sms.twilio.sid) {
      const params = new URLSearchParams({
        From: env.sms.twilio.from,
        To: to,
        Body: message,
      });
      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${env.sms.twilio.sid}/Messages.json`,
        params,
        { auth: { username: env.sms.twilio.sid, password: env.sms.twilio.token } }
      );
      return { delivered: true, channel: 'twilio' };
    }
  } catch (err) {
    console.error('[SMS] delivery failed, falling back to console:', err.message);
  }

  console.log(`\n[SMS:console] To: ${to}\n${message}\n`);
  return { delivered: false, channel: 'console' };
}
