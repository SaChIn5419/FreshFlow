import { apiClient } from '@/app/lib/axios';

export interface TopProductStat {
  id: string;
  name: string;
  category: string;
  total_quantity: number;
  unit: string;
}

export interface DashboardStats {
  orders_today: number;
  revenue_today: number;
  total_receivables: number;
  active_customers: number;
  total_products: number;
  top_products: TopProductStat[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};
