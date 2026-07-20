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

export const authApi = {
  login: (data: LoginRequest) =>
    axiosClient.post<ApiResponse<{ token: string; authenticated: boolean }>>('/auth/token', data),

  googleLogin: (data: GoogleLoginRequest) =>
    axiosClient.post<ApiResponse<{ token: string; authenticated: boolean }>>('/auth/google', data),

  logout: (token: string) =>
    axiosClient.post<ApiResponse<void>>('/auth/logout', { token }),

  /** Lấy thông tin tài khoản đang đăng nhập */
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

/** Đọc token từ localStorage */
export const getStoredToken = (): string | null =>
  localStorage.getItem(LS_KEYS.ACCESS_TOKEN);
