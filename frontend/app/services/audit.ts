import { apiClient } from '@/app/lib/axios';

export interface AuditLog {
  id: string;
  created_at: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any> | string;
}

import { PaginatedResponse } from './pagination';

export const auditService = {
  getAuditLogs: async (skip: number = 0, limit: number = 1000, search?: string): Promise<AuditLog[]> => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await apiClient.get<PaginatedResponse<AuditLog>>(`/audit-logs?${params.toString()}`);
    return response.data.items;
  },
};
