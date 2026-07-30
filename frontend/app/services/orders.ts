import { apiClient } from '@/app/lib/axios';

export interface OrderItemCreate {
  product_id: string;
  quantity: number;
  unit: string;
}

export interface OrderCreate {
  customer_id: string;
  expected_delivery_date?: string;
  items: OrderItemCreate[];
  notes?: string;
  remarks?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product: { id: string; name: string; unit: string; default_price?: number };
  quantity: number;
  unit: string;
  unit_price?: number;
}

export interface Order {
  id: string;
  customer_id: string;
  status: string;
  created_at: string;
  items: OrderItem[];
  customer: { id: string; restaurant_name: string; address?: string };
  remarks?: string;
}

export interface ParsedItem {
  raw_name: string;
  quantity: number;
  unit: string;
  matched_product_id: string | null;
  matched_product_name: string | null;
  confidence: number;
  top_matches: { product_id: string; product_name: string; unit: string }[];
}

export interface ParseResponse {
  items: ParsedItem[];
}

import { PaginatedResponse } from './pagination';

export const orderService = {
  createOrder: async (data: OrderCreate): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders/', data);
    return response.data;
  },

  getOrders: async (skip: number = 0, limit: number = 1000, search?: string): Promise<Order[]> => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await apiClient.get<PaginatedResponse<Order>>(`/orders/?${params.toString()}`);
    return response.data.items;
  },
  
  getOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },
  
  downloadPackingSlip: async (id: string): Promise<void> => {
    const response = await apiClient.get(`/orders/${id}/packing-slip/pdf`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `packing_slip_${id.slice(0,8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  parsePdfOrder: async (customerId: string, file: File): Promise<ParseResponse> => {
    const formData = new FormData();
    formData.append('customer_id', customerId);
    formData.append('file', file);
    const response = await apiClient.post<ParseResponse>('/orders/parse-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  parseTextOrder: async (customerId: string, text: string): Promise<ParseResponse> => {
    const response = await apiClient.post<ParseResponse>('/orders/parse-text', {
      customer_id: customerId,
      text: text
    });
    return response.data;
  },
  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const response = await apiClient.post<Order>(`/orders/${id}/status?status=${status}`);
    return response.data;
  },
  updateItemPrice: async (orderId: string, itemId: string, price: number): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/orders/${orderId}/items/${itemId}/price`, { price });
    return response.data;
  }
};
