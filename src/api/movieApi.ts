import axiosClient from './axiosClient';
import type { ApiResponse, PageResult } from '../types/api.types';
import type { Movie, Showtime } from '../types/domain.types';

export const movieApi = {
  getAll: (params?: { status?: string; page?: number; size?: number }) =>
    axiosClient.get<ApiResponse<PageResult<Movie>>>('/api/v1/movies', { params }),

  getById: (id: string) =>
    axiosClient.get<ApiResponse<Movie>>(`/api/v1/movies/${id}`),

  getShowtimes: (movieId: string) =>
    axiosClient.get<ApiResponse<Showtime[]>>(`/api/v1/showtimes/movie/${movieId}`),

  // Admin only
  create: (data: Partial<Movie>) =>
    axiosClient.post<ApiResponse<Movie>>('/api/v1/movies', data),

  update: (id: string, data: Partial<Movie>) =>
    axiosClient.put<ApiResponse<Movie>>(`/api/v1/movies/${id}`, data),

  delete: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/api/v1/movies/${id}`),
};
