import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api.types';
import type { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../types/domain.types';

export const userApi = {
  /** Láº¥y profile cá»§a user hiá»‡n táº¡i */
  getMyProfile: () =>
    axiosClient.get<ApiResponse<UserProfile>>('/api/v1/users/me'),

  /** User cáº­p nháº­t thÃ´ng tin cÃ¡ nhÃ¢n */
  updateMyProfile: (data: UpdateProfileRequest) =>
    axiosClient.patch<ApiResponse<UserProfile>>('/api/v1/users/me', data),

  /** User Ä‘á»•i máº­t kháº©u tÃ i khoáº£n cá»§a chÃ­nh mÃ¬nh */
  changeMyPassword: (data: ChangePasswordRequest) =>
    axiosClient.patch<ApiResponse<void>>('/api/v1/users/me/password', data),

  /** Gá»­i láº¡i email xÃ¡c thá»±c */
  resendEmailVerification: (data: { email: string }) =>
    axiosClient.post<ApiResponse<void>>('/api/v1/users/resend-verification', data),

  /** ADMIN: Láº¥y danh sÃ¡ch users */
  getAllUsers: (params?: { page?: number; size?: number; keyword?: string }) =>
    axiosClient.get<ApiResponse<any>>('/api/v1/users', { params }),

  /** ADMIN: Cap nhat user */
  updateUser: (id: string, data: Record<string, unknown>) =>
    axiosClient.put<ApiResponse<UserProfile>>(`/api/v1/users/${id}`, data),

  /** ADMIN: KhÃ³a/má»Ÿ khÃ³a user */
  blockUser: (id: string) =>
    axiosClient.patch<ApiResponse<UserProfile>>(`/api/v1/users/${id}/block`),

  unblockUser: (id: string) =>
    axiosClient.patch<ApiResponse<UserProfile>>(`/api/v1/users/${id}/unblock`),
};


