import axiosClient from './axiosClient';
import type { ApiResponse, PageResult } from '../types/api.types';
import type { Showtime, TicketResponse } from '../types/domain.types';

export const ticketApi = {
  /** USER: Xem vé của bản thân */
  getMyTickets: (params?: { page?: number; size?: number }) =>
    axiosClient.get<ApiResponse<PageResult<TicketResponse>>>('/api/v1/tickets/my', { params }),

  /** STAFF: Quét QR check-in */
  getOpenCheckInShowtimes: (cinemaId: string) =>
    axiosClient.get<ApiResponse<Showtime[]>>('/api/v1/tickets/check-in/showtimes', {
      params: { cinemaId },
    }),

  checkIn: (data: { qrCode: string; cinemaId: string; showtimeId: string }) =>
    axiosClient.post<ApiResponse<TicketResponse>>('/api/v1/tickets/check-in', data),

  /** ADMIN/STAFF: Xem tất cả vé */
  getAllTickets: (params?: { page?: number; size?: number }) =>
    axiosClient.get<ApiResponse<PageResult<TicketResponse>>>('/api/v1/tickets', { params }),
};
