import { apiClient } from '@/app/lib/axios';
import { Product } from './products';
import { Supplier } from './suppliers';

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity_ordered: number;
  unit: string;
  cost_price_at_time: number;
  quantity_received: number;
  is_received: boolean;
  product?: Product;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  triggered_by_order_id: string;
  status: string;
  expected_delivery?: string;
  whatsapp_message_text?: string;
  total_cost: number;
  paid_amount: number;
  balance_due: number;
  payment_status: string;
  items: PurchaseOrderItem[];
  supplier?: Supplier;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderUpdate {
  status?: string;
  expected_delivery?: string;
  whatsapp_message_text?: string;
  total_cost?: number;
}

export interface PurchaseOrderItemUpdate {
  quantity_received?: number;
  is_received?: boolean;
}

export interface WhatsAppTextResponse {
  whatsapp_text: string;
}

export const purchaseOrderService = {
  getPurchaseOrders: async (params?: { supplier_id?: string; order_id?: string }): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<PurchaseOrder[]>('/purchase-orders/', { params });
    return response.data;
  },
  getPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
    return response.data;
  },
  getWhatsAppText: async (id: string): Promise<string> => {
    const response = await apiClient.get<WhatsAppTextResponse>(`/purchase-orders/${id}/whatsapp`);
    return response.data.whatsapp_text;
  },
  updatePurchaseOrder: async (id: string, data: PurchaseOrderUpdate): Promise<PurchaseOrder> => {
    const response = await apiClient.patch<PurchaseOrder>(`/purchase-orders/${id}`, data);
    return response.data;
  },
  receivePOItem: async (poId: string, itemId: string, data: PurchaseOrderItemUpdate): Promise<PurchaseOrderItem> => {
    const response = await apiClient.patch<PurchaseOrderItem>(`/purchase-orders/${poId}/items/${itemId}/receive`, data);
    return response.data;
  },
  generatePOsForOrder: async (orderId: string): Promise<PurchaseOrder[]> => {
    const response = await apiClient.post<PurchaseOrder[]>(`/orders/${orderId}/generate-purchase-orders`);
    return response.data;
  },
};
