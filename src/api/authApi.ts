import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api.types';

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

  getMyProfile: () =>
    axiosClient.get<ApiResponse<any>>('/api/v1/users/me'),

  register: (data: RegisterRequest) =>
    axiosClient.post<ApiResponse<any>>('/api/v1/users/register', data),
};
