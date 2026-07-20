import axiosClient from './axiosClient';
import type { ApiResponse, PageResult } from '../types/api.types';

export type DiscountType = 'PERCENT' | 'FIXED';
export type PromotionAdminStatus = 'ALL' | 'AVAILABLE' | 'UPCOMING' | 'EXPIRED' | 'INACTIVE' | 'EXHAUSTED';

export interface PromotionResponse {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderValue?: number | null;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
}

export interface PromotionRequest {
  code?: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderValue?: number | null;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  isActive?: boolean;
}

export const promotionApi = {
  getPromotions(params?: {
    status?: PromotionAdminStatus;
    keyword?: string;
    page?: number;
    size?: number;
    sort?: string;
  }) {
    return axiosClient.get<ApiResponse<PageResult<PromotionResponse>>>('/api/v1/promotions', { params });
  },

  createPromotion(payload: PromotionRequest) {
    return axiosClient.post<ApiResponse<PromotionResponse>>('/api/v1/promotions', payload);
  },

  updatePromotion(id: string, payload: Partial<PromotionRequest>) {
    return axiosClient.put<ApiResponse<PromotionResponse>>(`/api/v1/promotions/${id}`, payload);
  },

  deletePromotion(id: string) {
    return axiosClient.delete<ApiResponse<void>>(`/api/v1/promotions/${id}`);
  },
};
