import axiosClient from './axiosClient';
import type { ApiResponse, PageResult } from '../types/api.types';
import type {
  DashboardSummaryResponse,
  RevenueByPeriodResponse,
  TopMovieRevenueResponse,
  ShowtimeStatsResponse,
} from '../types/domain.types';

export const analyticsApi = {
  getSummary: () =>
    axiosClient.get<ApiResponse<DashboardSummaryResponse>>('/api/v1/analytics/summary'),

  getDailyRevenue: (from?: string, to?: string) =>
    axiosClient.get<ApiResponse<RevenueByPeriodResponse[]>>('/api/v1/analytics/revenue/daily', {
      params: { from, to },
    }),

  getMonthlyRevenue: (from?: string, to?: string) =>
    axiosClient.get<ApiResponse<RevenueByPeriodResponse[]>>('/api/v1/analytics/revenue/monthly', {
      params: { from, to },
    }),

  getTopMovies: (from?: string, to?: string, limit = 10) =>
    axiosClient.get<ApiResponse<TopMovieRevenueResponse[]>>('/api/v1/analytics/movies/top-revenue', {
      params: { from, to, limit },
    }),

  getShowtimeStats: (params?: { cinemaId?: string; from?: string; to?: string; page?: number; size?: number }) =>
    axiosClient.get<ApiResponse<PageResult<ShowtimeStatsResponse>>>('/api/v1/analytics/showtimes', {
      params,
    }),
};
