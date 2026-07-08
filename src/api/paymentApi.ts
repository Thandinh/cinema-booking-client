import axiosClient from './axiosClient';
import type { ApiResponse, PageResult } from '../types/api.types';

// Assuming we have PaymentResponse in domain.types.ts, but for now using any
export interface PaymentResponse {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  transactionNo: string;
  status: string;
  paymentTime: string;
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
  }
};
