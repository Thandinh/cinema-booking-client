import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type AuthResponsePayload = {
  result?: {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
  };
};

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

const isAuthAttempt = (url: string) =>
  url.includes('/auth/token') ||
  url.includes('/auth/google') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/logout') ||
  url.includes('/api/v1/users/register') ||
  url.includes('/api/v1/users/verify-email') ||
  url.includes('/api/v1/users/resend-verification') ||
  url.includes('/api/v1/users/forgot-password') ||
  url.includes('/api/v1/users/reset-password');

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  const response = await refreshClient.post<AuthResponsePayload>(
    '/auth/refresh',
    refreshToken ? { token: refreshToken } : {}
  );

  const result = response.data?.result;
  const accessToken = result?.accessToken || result?.token || null;
  if (!accessToken) return null;

  useAuthStore.getState().updateTokens(accessToken, result?.refreshToken);
  return accessToken;
};

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
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const requestUrl = originalRequest?.url || '';

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthAttempt(requestUrl)) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }

        const accessToken = await refreshPromise;
        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosClient(originalRequest);
        }
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);

export default axiosClient;