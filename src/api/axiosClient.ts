import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Use relative URLs - Vite proxy will forward to backend:8080
const axiosClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthAttempt =
      requestUrl.includes('/auth/token') ||
      requestUrl.includes('/auth/google') ||
      requestUrl.includes('/api/v1/users/register') ||
      requestUrl.includes('/api/v1/users/verify-email') ||
      requestUrl.includes('/api/v1/users/resend-verification') ||
      requestUrl.includes('/api/v1/users/forgot-password') ||
      requestUrl.includes('/api/v1/users/reset-password');

    if (error.response?.status === 401 && !isAuthAttempt) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
