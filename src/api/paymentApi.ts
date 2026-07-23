import axiosClient from './axiosClient';
import type { ApiResponse, PageResult } from '../types/api.types';

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

export type PaymentEventType =
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_REUSED'
  | 'PAYMENT_URL_CREATED'
  | 'VNPAY_CALLBACK_RECEIVED'
  | 'VNPAY_CALLBACK_INVALID_SIGNATURE'
  | 'VNPAY_AMOUNT_MISMATCH'
  | 'MOMO_CALLBACK_RECEIVED'
  | 'MOMO_CALLBACK_INVALID_SIGNATURE'
  | 'MOMO_AMOUNT_MISMATCH'
  | 'PAYMENT_ALREADY_PROCESSED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_EXPIRED'
  | 'PAYMENT_PROVIDER_ERROR';

export interface PaymentEventResponse {
  id: string;
  paymentId?: string;
  bookingId?: string;
  method?: string;
  transactionNo?: string;
  eventType: PaymentEventType;
  paymentStatusBefore?: string;
  paymentStatusAfter?: string;
  bookingStatusBefore?: string;
  bookingStatusAfter?: string;
  success?: boolean;
  message?: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
}

export interface PaymentReconciliationIssueResponse {
  issueType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  bookingId?: string;
  paymentId?: string;
  transactionNo?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  message?: string;
  createdAt?: string;
}

export const paymentApi = {
  initiatePayment(bookingId: string, method: string, amount: number) {
    return axiosClient.post<ApiResponse<string>>('/api/v1/payments/initiate', null, {
      params: {
        bookingId,
        method,
        amount,
      },
    });
  },

  getMyPayments(params?: unknown) {
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
  },

  getPaymentEvents(params?: {
    bookingId?: string;
    paymentId?: string;
    eventType?: PaymentEventType;
    success?: boolean;
    keyword?: string;
    page?: number;
    size?: number;
    sort?: string;
  }) {
    return axiosClient.get<ApiResponse<PageResult<PaymentEventResponse>>>('/api/v1/payments/events', { params });
  },

  getReconciliationIssues(limit = 100) {
    return axiosClient.get<ApiResponse<PaymentReconciliationIssueResponse[]>>('/api/v1/payments/reconciliation', {
      params: { limit },
    });
  },
};
