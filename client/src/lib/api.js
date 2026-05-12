import axios from 'axios';

const api = axios.create({
  baseURL: 'https://cafe-indoor-backend.vercel.app/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const url = config.url || '';
  let token;
  // Route-specific token selection
  if (url.startsWith('/admin') || url.startsWith('/auth/admin')) {
    token = localStorage.getItem('ci_admin_token');
  } else if (url.startsWith('/partner')) {
    token = localStorage.getItem('ci_partner_token');
  } else {
    // Customer routes — fall back to any available token
    token = localStorage.getItem('ci_customer_token')
      || localStorage.getItem('ci_partner_token')
      || localStorage.getItem('ci_admin_token');
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ci_customer_token');
      localStorage.removeItem('ci_partner_token');
      localStorage.removeItem('ci_admin_token');
    }
    return Promise.reject(err);
  }
);

// Auth helpers — set the correct token per portal
export function setToken(role, token) {
  localStorage.setItem(`ci_${role}_token`, token);
}

export function getToken(role) {
  return localStorage.getItem(`ci_${role}_token`);
}

export function clearToken(role) {
  localStorage.removeItem(`ci_${role}_token`);
}

// Convenience method for portal-specific instances
export function getAuthHeader(role) {
  const token = getToken(role);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default api;
