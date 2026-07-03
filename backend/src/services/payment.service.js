import axios from 'axios';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const PAYSTACK_BASE = 'https://api.paystack.co';

function client() {
  if (!env.paystack.enabled) {
    throw ApiError.badRequest('Payment provider is not configured (PAYSTACK_SECRET_KEY missing)');
  }
  return axios.create({
    baseURL: PAYSTACK_BASE,
    headers: { Authorization: `Bearer ${env.paystack.secretKey}` },
  });
}

/**
 * Initialize a Paystack transaction. Amount is in GHS (we convert to pesewas).
 * Mobile money channels (MTN MoMo, Telecel, AirtelTigo) are enabled by Paystack
 * automatically for Ghana accounts.
 */
export async function initializePayment({ email, amountGhs, reference, metadata }) {
  const { data } = await client().post('/transaction/initialize', {
    email,
    amount: Math.round(Number(amountGhs) * 100),
    currency: 'GHS',
    reference,
    metadata,
    channels: ['mobile_money', 'card'],
    callback_url: `${env.clientUrl}/payment/callback`,
  });
  return data.data; // { authorization_url, access_code, reference }
}

export async function verifyPayment(reference) {
  const { data } = await client().get(`/transaction/verify/${encodeURIComponent(reference)}`);
  return data.data; // { status, amount, channel, ... }
}
