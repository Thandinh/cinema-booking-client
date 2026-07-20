import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api.types';
import type { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../types/domain.types';

export const userApi = {
  /** Lấy profile của user hiện tại */
  getMyProfile: () =>
    axiosClient.get<ApiResponse<UserProfile>>('/api/v1/users/me'),

  /** User cập nhật thông tin cá nhân */
  updateMyProfile: (data: UpdateProfileRequest) =>
    axiosClient.patch<ApiResponse<UserProfile>>('/api/v1/users/me', data),

  /** User đổi mật khẩu tài khoản của chính mình */
  changeMyPassword: (data: ChangePasswordRequest) =>
    axiosClient.patch<ApiResponse<void>>('/api/v1/users/me/password', data),

  /** Gửi lại email xác thực */
  resendEmailVerification: (data: { email: string }) =>
    axiosClient.post<ApiResponse<void>>('/api/v1/users/resend-verification', data),

  /** ADMIN: Lấy danh sách users */
  getAllUsers: (params?: { page?: number; size?: number; keyword?: string }) =>
    axiosClient.get<ApiResponse<any>>('/api/v1/users', { params }),

  /** ADMIN: Khóa/mở khóa user */
  blockUser: (id: string) =>
    axiosClient.patch<ApiResponse<UserProfile>>(`/api/v1/users/${id}/block`),

  unblockUser: (id: string) =>
    axiosClient.patch<ApiResponse<UserProfile>>(`/api/v1/users/${id}/unblock`),
};
