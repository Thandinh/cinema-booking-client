import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api.types';

export type SeatType = 'NORMAL' | 'VIP' | 'COUPLE';
export type SeatLayoutTemplate = 'CUSTOM' | 'STANDARD_CINEMA';

export interface RoomResponse {
  id: string;
  cinemaId: string;
  cinemaName?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeatResponse {
  id: string;
  roomId: string;
  roomName?: string;
  rowLabel: string;
  seatNumber: number;
  seatCode: string;
  seatType: SeatType;
  priceMultiplier: number;
  rowIndex?: number | null;
  colIndex?: number | null;
}

export interface SeatBulkGenerateResponse {
  totalRequested: number;
  totalCreated: number;
  totalSkipped: number;
  totalSeatStatusesCreated: number;
  createdSeats: SeatResponse[];
}

export const roomSeatApi = {
  getRoomsByCinema(cinemaId: string) {
    return axiosClient.get<ApiResponse<RoomResponse[]>>(`/api/v1/rooms/cinema/${cinemaId}`);
  },

  createRoom(payload: { cinemaId: string; name: string }) {
    return axiosClient.post<ApiResponse<RoomResponse>>('/api/v1/rooms', payload);
  },

  updateRoom(id: string, payload: { name?: string }) {
    return axiosClient.put<ApiResponse<RoomResponse>>(`/api/v1/rooms/${id}`, payload);
  },

  deleteRoom(id: string) {
    return axiosClient.delete<ApiResponse<void>>(`/api/v1/rooms/${id}`);
  },

  getSeatsByRoom(roomId: string) {
    return axiosClient.get<ApiResponse<SeatResponse[]>>(`/api/v1/seats/room/${roomId}`);
  },

  bulkGenerateSeats(payload: {
    roomId: string;
    rowLabels: string[];
    seatsPerRow: number;
    layoutTemplate: SeatLayoutTemplate;
    seatType: SeatType;
    priceMultiplier: number;
    skipExisting: boolean;
  }) {
    return axiosClient.post<ApiResponse<SeatBulkGenerateResponse>>('/api/v1/seats/bulk-generate', payload);
  },

  updateSeat(id: string, payload: {
    seatType?: SeatType;
    priceMultiplier?: number;
    rowIndex?: number;
    colIndex?: number;
  }) {
    return axiosClient.put<ApiResponse<SeatResponse>>(`/api/v1/seats/${id}`, payload);
  },

  deleteSeat(id: string) {
    return axiosClient.delete<ApiResponse<void>>(`/api/v1/seats/${id}`);
  },
};
