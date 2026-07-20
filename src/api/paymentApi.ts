import axiosClient from './axiosClient';
import type { ApiResponse, PageResult } from '../types/api.types';

// Assuming we have PaymentResponse in domain.types.ts, but for now using any
export interface PaymentResponse {
  id: string;
  bookingId: string;
  bookingCode?: string;
  bookingStatus?: string;
  customerId?: string;
  customerUsername?: string;
  customerName?: string;
  customerEmail?: string;
  movieTitle?: string;
  cinemaName?: string;
  roomName?: string;
  showtimeStartTime?: string;
  amount: number;
  method: string;
  transactionNo: string;
  status: string;
  paymentTime?: string;
}

export const paymentApi = {
  initiatePayment(bookingId: string, method: string, amount: number) {
    return axiosClient.post<ApiResponse<string>>('/api/v1/payments/initiate', null, {
      params: {
        bookingId,
        method,
        amount
      }
    });
  },

  getMyPayments(params?: any) {
    return axiosClient.get<ApiResponse<PageResult<PaymentResponse>>>('/api/v1/payments/my', { params });
  },

  getAllPayments(params?: {
    status?: string;
    method?: string;
    keyword?: string;
    page?: number;
    size?: number;
    sort?: string;
  }) {
    return axiosClient.get<ApiResponse<PageResult<PaymentResponse>>>('/api/v1/payments', { params });
  }
};
