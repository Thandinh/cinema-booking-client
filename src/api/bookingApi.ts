import axiosClient from './axiosClient';
import type { ApiResponse, PageResult } from '../types/api.types';
import type { 
  HoldSeatRequest, 
  HoldSeatResponse, 
  CreateBookingRequest, 
  BookingResponse,
  SeatMapItem,
} from '../types/domain.types';

export const bookingApi = {
  getSeatMap(showtimeId: string) {
    return axiosClient.get<ApiResponse<SeatMapItem[]>>(`/api/v1/showtimes/${showtimeId}/seats`);
  },

  holdSeats(data: HoldSeatRequest) {
    return axiosClient.post<ApiResponse<HoldSeatResponse>>('/api/v1/bookings/hold', data);
  },

  createBooking(data: CreateBookingRequest) {
    return axiosClient.post<ApiResponse<BookingResponse>>('/api/v1/bookings', data);
  },

  getMyBookings(params?: any) {
    return axiosClient.get<ApiResponse<PageResult<BookingResponse>>>('/api/v1/bookings/my', { params });
  },

  getAllBookings(params?: { status?: string; page?: number; size?: number; sort?: string }) {
    return axiosClient.get<ApiResponse<PageResult<BookingResponse>>>('/api/v1/bookings', { params });
  },

  getBookingById(id: string) {
    return axiosClient.get<ApiResponse<BookingResponse>>(`/api/v1/bookings/${id}`);
  },

  cancelBooking(id: string) {
    return axiosClient.patch<ApiResponse<BookingResponse>>(`/api/v1/bookings/${id}/cancel`);
  }
};
