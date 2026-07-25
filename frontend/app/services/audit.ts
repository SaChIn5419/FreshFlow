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

export const auditService = {
  getAuditLogs: async (): Promise<AuditLog[]> => {
    // The base URL already has /api/v1, so we just use /audit-logs
    const response = await apiClient.get<AuditLog[]>('/audit-logs');
    return response.data;
  },
};
