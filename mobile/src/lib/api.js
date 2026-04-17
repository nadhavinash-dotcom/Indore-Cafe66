import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const url = config.url || '';
  let tokenKey;
  if (url.startsWith('/admin') || url.startsWith('/auth/admin')) {
    tokenKey = 'ci_admin_token';
  } else if (url.startsWith('/partner')) {
    tokenKey = 'ci_partner_token';
  } else {
    tokenKey = 'ci_customer_token';
  }

  try {
    const token = await AsyncStorage.getItem(tokenKey);
    if (!token && tokenKey === 'ci_customer_token') {
      const fallback =
        (await AsyncStorage.getItem('ci_partner_token')) ||
        (await AsyncStorage.getItem('ci_admin_token'));
      if (fallback) config.headers.Authorization = `Bearer ${fallback}`;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove([
        'ci_customer_token',
        'ci_partner_token',
        'ci_admin_token',
        'ci_customer_user',
        'ci_partner_user',
        'ci_admin_user',
      ]);
    }
    return Promise.reject(err);
  }
);

export default api;
