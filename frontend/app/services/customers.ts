import { apiClient } from '@/app/lib/axios';

export interface TemplateItem {
  product_id: string;
  sort_order: number;
  product_name: string;
  product_unit?: string;
}

export interface Customer {
  id: string;
  user_id: string;
  restaurant_name: string;
  contact_person?: string;
  gst_number?: string;
  phone?: string;
  address?: string;
  credit_days: number;
  is_active: boolean;
}

export interface CustomerCreate {
  restaurant_name: string;
  contact_person?: string;
  email: string;
  password?: string;
  gst_number?: string;
  phone?: string;
  address?: string;
  credit_days: number;
  is_active: boolean;
}

export interface CustomerUpdate {
  restaurant_name: string;
  contact_person?: string;
  gst_number?: string;
  phone?: string;
  address?: string;
  credit_days: number;
  is_active: boolean;
}

import { PaginatedResponse } from './pagination';

export const customerService = {
  getCustomers: async (skip: number = 0, limit: number = 1000, search?: string): Promise<Customer[]> => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await apiClient.get<PaginatedResponse<Customer>>(`/customers/?${params.toString()}`);
    return response.data.items;
  },
  getCustomer: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
  },
  createCustomer: async (data: CustomerCreate): Promise<Customer> => {
    const response = await apiClient.post<Customer>('/customers/', data);
    return response.data;
  },
  updateCustomer: async (id: string, data: CustomerUpdate): Promise<Customer> => {
    const response = await apiClient.put<Customer>(`/customers/${id}`, data);
    return response.data;
  },
  deactivateCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },
  getTemplates: async (customerId: string): Promise<TemplateItem[]> => {
    const response = await apiClient.get<TemplateItem[]>(`/customers/${customerId}/templates`);
    return response.data;
  },
  assignProductToTemplate: async (customerId: string, productId: string, sortOrder: number = 0): Promise<void> => {
    await apiClient.post(`/customers/${customerId}/templates`, {
      product_id: productId,
      sort_order: sortOrder
    });
  },
  removeProductFromTemplate: async (customerId: string, productId: string): Promise<void> => {
    await apiClient.delete(`/customers/${customerId}/templates/${productId}`);
  },

  getCustomerPrices: async (id: string) => {
    const response = await apiClient.get<Record<string, number>>(`/customers/${id}/prices`);
    return response.data;
  },
};
