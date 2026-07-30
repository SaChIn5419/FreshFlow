import { apiClient } from '@/app/lib/axios';

export interface CustomerPaymentCreate {
  customer_id: string;
  invoice_id?: string;
  amount: number;
  method: string;
  notes?: string;
}

export interface CustomerPaymentResponse {
  id: string;
  customer_id: string;
  invoice_id?: string;
  amount: number;
  payment_date: string;
  method: string;
  notes?: string;
  created_at: string;
}

export interface SupplierPaymentCreate {
  supplier_id: string;
  purchase_order_id?: string;
  amount: number;
  method: string;
  notes?: string;
}

export interface SupplierPaymentResponse {
  id: string;
  supplier_id: string;
  purchase_order_id?: string;
  amount: number;
  payment_date: string;
  method: string;
  notes?: string;
  created_at: string;
}

export interface ProfitabilityMetrics {
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  gross_margin_percent: number;
}

import { PaginatedResponse } from './pagination';

export const financeService = {
  recordCustomerPayment: async (data: CustomerPaymentCreate) => {
    const response = await apiClient.post<CustomerPaymentResponse>('/finance/customer-payments', data);
    return response.data;
  },
  
  getCustomerPayments: async (skip: number = 0, limit: number = 1000) => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    const response = await apiClient.get<PaginatedResponse<CustomerPaymentResponse>>(`/finance/customer-payments?${params.toString()}`);
    return response.data.items;
  },

  recordSupplierPayment: async (data: SupplierPaymentCreate) => {
    const response = await apiClient.post<SupplierPaymentResponse>('/finance/supplier-payments', data);
    return response.data;
  },

  getSupplierPayments: async (skip: number = 0, limit: number = 1000) => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    const response = await apiClient.get<PaginatedResponse<SupplierPaymentResponse>>(`/finance/supplier-payments?${params.toString()}`);
    return response.data.items;
  },

  getProfitability: async () => {
    const response = await apiClient.get<ProfitabilityMetrics>('/finance/profit');
    return response.data;
  }
};
