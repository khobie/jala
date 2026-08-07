import axios from 'axios';

// Local dev: Vite proxy (/api). Production (Vercel/Render): set VITE_API_URL to your Render API URL.
const apiRoot = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const api = axios.create({
  baseURL: apiRoot ? `${apiRoot}/api` : '/api',
  // Render free tier can take ~30s to wake; avoid hanging forever in the UI.
  timeout: 90_000,
});

// Attach JWT from localStorage on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error messages.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    let message = err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
    if (err.code === 'ECONNABORTED') {
      message = 'The server is taking too long to respond. Wait 30 seconds and try again (Render free tier cold start).';
    } else if (!err.response && err.message?.includes('Network Error')) {
      message = 'Cannot reach the API. Check your internet connection or try again in a moment.';
    }
    return Promise.reject({ ...err, message, details: err.response?.data?.details });
  }
);

export default api;
