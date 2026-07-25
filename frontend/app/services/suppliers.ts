import { apiClient } from '@/app/lib/axios';
import { Product } from './products';

export interface ProductSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  cost_price: number;
  is_primary_supplier: boolean;
  notes?: string;
  product?: Product;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  credit_days: number;
  average_lead_time: number;
  current_balance: number;
  notes?: string;
  is_active: boolean;
  products?: ProductSupplier[];
}

export interface SupplierCreate {
  name: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  credit_days: number;
  average_lead_time: number;
  notes?: string;
}

export interface SupplierUpdate {
  name?: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  credit_days?: number;
  average_lead_time?: number;
  current_balance?: number;
  notes?: string;
  is_active?: boolean;
}

export interface ProductSupplierCreate {
  product_id: string;
  cost_price: number;
  is_primary_supplier: boolean;
  notes?: string;
}

export const supplierService = {
  getSuppliers: async (): Promise<Supplier[]> => {
    const response = await apiClient.get<Supplier[]>('/suppliers/');
    return response.data;
  },
  getSupplier: async (id: string): Promise<Supplier> => {
    const response = await apiClient.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },
  createSupplier: async (data: SupplierCreate): Promise<Supplier> => {
    const response = await apiClient.post<Supplier>('/suppliers/', data);
    return response.data;
  },
  updateSupplier: async (id: string, data: SupplierUpdate): Promise<Supplier> => {
    const response = await apiClient.put<Supplier>(`/suppliers/${id}`, data);
    return response.data;
  },
  deleteSupplier: async (id: string): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}`);
  },
  linkProductToSupplier: async (supplierId: string, data: ProductSupplierCreate): Promise<ProductSupplier> => {
    const response = await apiClient.post<ProductSupplier>(`/suppliers/${supplierId}/products`, data);
    return response.data;
  },
  unlinkProductFromSupplier: async (supplierId: string, productId: string): Promise<void> => {
    await apiClient.delete(`/suppliers/${supplierId}/products/${productId}`);
  },
  getProductSuppliers: async (productId: string): Promise<ProductSupplier[]> => {
    const response = await apiClient.get<ProductSupplier[]>(`/suppliers/products/${productId}`);
    return response.data;
  },
};
