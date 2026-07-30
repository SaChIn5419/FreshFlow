import { apiClient } from '@/app/lib/axios';

export interface Product {
  id: string;
  name: string;
  category?: string;
  unit: string;
  default_price?: number;
  stock_quantity?: number;
  reorder_level?: number;
  is_active: boolean;
}

export interface ProductCreate {
  name: string;
  category?: string;
  unit: string;
  default_price?: number;
  stock_quantity?: number;
  reorder_level?: number;
}

export interface ProductUpdate {
  name?: string;
  category?: string;
  unit?: string;
  default_price?: number;
  stock_quantity?: number;
  reorder_level?: number;
  is_active?: boolean;
}

import { PaginatedResponse } from './pagination';

export const productService = {
  getProducts: async (skip: number = 0, limit: number = 1000, search?: string): Promise<Product[]> => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await apiClient.get<PaginatedResponse<Product>>(`/products/?${params.toString()}`);
    return response.data.items;
  },
  getProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },
  createProduct: async (data: ProductCreate): Promise<Product> => {
    const response = await apiClient.post<Product>('/products/', data);
    return response.data;
  },
  updateProduct: async (id: string, data: ProductUpdate): Promise<Product> => {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },
  deactivateProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
