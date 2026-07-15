import axiosClient from './axiosClient';
import type { ApiResponse, PageResult } from '../types/api.types';
import type { TicketResponse } from '../types/domain.types';

export const ticketApi = {
  /** USER: Xem vé của bản thân */
  getMyTickets: (params?: { page?: number; size?: number }) =>
    axiosClient.get<ApiResponse<PageResult<TicketResponse>>>('/api/v1/tickets/my', { params }),

  /** STAFF: Quét QR check-in */
  checkIn: (qrCode: string) =>
    axiosClient.post<ApiResponse<TicketResponse>>('/api/v1/tickets/check-in', { qrCode }),

  /** ADMIN/STAFF: Xem tất cả vé */
  getAllTickets: (params?: { page?: number; size?: number }) =>
    axiosClient.get<ApiResponse<PageResult<TicketResponse>>>('/api/v1/tickets', { params }),
};
