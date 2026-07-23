import { LS_KEYS } from '../constants';
import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api.types';
import type { UserInfo } from '../stores/authStore';

export interface LoginRequest { username: string; password: string; }
export interface GoogleLoginRequest { idToken: string; }
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}
export interface VerifyEmailRequest { token: string; }
export interface ResendVerificationRequest { email: string; }
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthenticationResult {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  authenticated: boolean;
}

export const getAccessToken = (result?: AuthenticationResult | null): string =>
  result?.accessToken || result?.token || '';

export const authApi = {
  login: (data: LoginRequest) =>
    axiosClient.post<ApiResponse<AuthenticationResult>>('/auth/token', data),

  googleLogin: (data: GoogleLoginRequest) =>
    axiosClient.post<ApiResponse<AuthenticationResult>>('/auth/google', data),

  refresh: (refreshToken?: string | null) =>
    axiosClient.post<ApiResponse<AuthenticationResult>>(
      '/auth/refresh',
      refreshToken ? { token: refreshToken } : {},
      { withCredentials: true }
    ),

  logout: (token?: string | null, refreshToken?: string | null) =>
    axiosClient.post<ApiResponse<void>>('/auth/logout', { token, refreshToken }, { withCredentials: true }),

  /** Láº¥y thÃ´ng tin tÃ i khoáº£n Ä‘ang Ä‘Äƒng nháº­p */
  getMyProfile: (token?: string) =>
    axiosClient.get<ApiResponse<UserInfo & { email?: string; phone?: string }>>('/api/v1/users/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  register: (data: RegisterRequest) =>
    axiosClient.post<ApiResponse<UserInfo>>('/api/v1/users/register', data),

  verifyEmail: (data: VerifyEmailRequest) =>
    axiosClient.post<ApiResponse<void>>('/api/v1/users/verify-email', data),

  resendVerification: (data: ResendVerificationRequest) =>
    axiosClient.post<ApiResponse<void>>('/api/v1/users/resend-verification', data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    axiosClient.post<ApiResponse<void>>('/api/v1/users/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    axiosClient.post<ApiResponse<void>>('/api/v1/users/reset-password', data),
};

/** Äá»c token tá»« localStorage */
export const getStoredToken = (): string | null =>
  localStorage.getItem(LS_KEYS.ACCESS_TOKEN);

export const getStoredRefreshToken = (): string | null =>
  localStorage.getItem(LS_KEYS.REFRESH_TOKEN);