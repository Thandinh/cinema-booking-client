import { LS_KEYS } from '../constants';
import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api.types';
import type { UserInfo } from '../stores/authStore';

export interface LoginRequest { username: string; password: string; }
export interface RegisterRequest {
  username: string; password: string;
  firstName: string; lastName: string;
  email: string; phone?: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    axiosClient.post<ApiResponse<{ token: string; authenticated: boolean }>>('/auth/token', data),

  logout: (token: string) =>
    axiosClient.post<ApiResponse<void>>('/auth/logout', { token }),

  /** Lấy thông tin tài khoản đang đăng nhập */
  getMyProfile: (token?: string) =>
    axiosClient.get<ApiResponse<UserInfo & { email?: string; phone?: string }>>('/api/v1/users/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  register: (data: RegisterRequest) =>
    axiosClient.post<ApiResponse<UserInfo>>('/api/v1/users/register', data),
};

/** Đọc token từ localStorage */
export const getStoredToken = (): string | null =>
  localStorage.getItem(LS_KEYS.ACCESS_TOKEN);
