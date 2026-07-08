import axiosClient from './axiosClient';
import type { ApiResponse, PageResult } from '../types/api.types';
import type { Cinema, Showtime } from '../types/domain.types';

export interface CinemaMapItem {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

export const cinemaApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    axiosClient.get<ApiResponse<PageResult<Cinema>>>('/api/v1/cinemas', { params }),

  getById: (id: string) =>
    axiosClient.get<ApiResponse<Cinema>>(`/api/v1/cinemas/${id}`),

  getMapData: () =>
    axiosClient.get<ApiResponse<CinemaMapItem[]>>('/api/v1/cinemas/map'),

  getNearest: (lat: number, lng: number, limit = 5) =>
    axiosClient.get<ApiResponse<CinemaMapItem[]>>('/api/v1/cinemas/nearest', {
      params: { lat, lng, limit },
    }),

  getShowtimes: (cinemaId: string, params?: { date?: string }) =>
    axiosClient.get<ApiResponse<Showtime[]>>(`/api/v1/showtimes/cinema/${cinemaId}`, { params }),
};
