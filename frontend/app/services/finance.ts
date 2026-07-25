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

export const financeService = {
  recordCustomerPayment: async (data: CustomerPaymentCreate) => {
    const response = await apiClient.post<CustomerPaymentResponse>('/finance/customer-payments', data);
    return response.data;
  },
  
  getCustomerPayments: async () => {
    const response = await apiClient.get<CustomerPaymentResponse[]>('/finance/customer-payments');
    return response.data;
  },

  recordSupplierPayment: async (data: SupplierPaymentCreate) => {
    const response = await apiClient.post<SupplierPaymentResponse>('/finance/supplier-payments', data);
    return response.data;
  },

  getSupplierPayments: async () => {
    const response = await apiClient.get<SupplierPaymentResponse[]>('/finance/supplier-payments');
    return response.data;
  },

  getProfitability: async () => {
    const response = await apiClient.get<ProfitabilityMetrics>('/finance/profit');
    return response.data;
  }
};
