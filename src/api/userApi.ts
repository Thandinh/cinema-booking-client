import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api.types';
import type { UserProfile, UpdateProfileRequest } from '../types/domain.types';

export const userApi = {
  /** Lấy profile của user hiện tại */
  getMyProfile: () =>
    axiosClient.get<ApiResponse<UserProfile>>('/api/v1/users/me'),

  /** User cập nhật thông tin cá nhân */
  updateMyProfile: (data: UpdateProfileRequest) =>
    axiosClient.patch<ApiResponse<UserProfile>>('/api/v1/users/me', data),

  /** ADMIN: Lấy danh sách users */
  getAllUsers: (params?: { page?: number; size?: number; keyword?: string }) =>
    axiosClient.get<ApiResponse<any>>('/api/v1/users', { params }),

  /** ADMIN: Khóa/mở khóa user */
  blockUser: (id: string) =>
    axiosClient.patch<ApiResponse<UserProfile>>(`/api/v1/users/${id}/block`),

  unblockUser: (id: string) =>
    axiosClient.patch<ApiResponse<UserProfile>>(`/api/v1/users/${id}/unblock`),
};
