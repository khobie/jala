import axios from 'axios';

// Local dev: Vite proxy (/api). Production (Vercel/Render): set VITE_API_URL to your Render API URL.
const apiRoot = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const api = axios.create({
  baseURL: apiRoot ? `${apiRoot}/api` : '/api',
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
    const message =
      err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
    return Promise.reject({ ...err, message, details: err.response?.data?.details });
  }
);

export default api;
