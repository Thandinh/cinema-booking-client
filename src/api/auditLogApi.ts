import axiosClient from './axiosClient';
import type { ApiResponse, PageResult } from '../types/api.types';

export interface AdminAuditLogResponse {
  id: string;
  actorId?: string;
  actorUsername?: string;
  httpMethod: string;
  action: string;
  resource: string;
  resourceId?: string;
  requestPath: string;
  queryString?: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  success?: boolean;
  errorMessage?: string;
  createdAt: string;
}

export const auditLogApi = {
  getAuditLogs(params?: {
    action?: string;
    resource?: string;
    success?: boolean;
    keyword?: string;
    page?: number;
    size?: number;
    sort?: string;
  }) {
    return axiosClient.get<ApiResponse<PageResult<AdminAuditLogResponse>>>(
      '/api/v1/admin/audit-logs',
      { params }
    );
  },
};
