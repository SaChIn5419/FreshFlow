import { apiClient } from '@/app/lib/axios';

export interface PackingListItem {
  id: string;
  packing_list_id: string;
  product_id: string;
  quantity_requested: number;
  quantity_packed: number;
  unit: string;
  is_packed: boolean;
  product?: {
    id: string;
    name: string;
    category?: string;
    unit: string;
  };
}

export interface PackingList {
  id: string;
  order_id: string;
  status: string; // "Pending", "In Progress", "Packed"
  packed_by?: string;
  notes?: string;
  items: PackingListItem[];
}

export interface PackingListItemUpdate {
  quantity_packed?: number;
  is_packed?: boolean;
}

export interface PackingListUpdate {
  status?: string;
  packed_by?: string;
  notes?: string;
}

export const packingService = {
  getPackingLists: async (): Promise<PackingList[]> => {
    const response = await apiClient.get<PackingList[]>('/packing/');
    return response.data;
  },

  getPackingListForOrder: async (orderId: string): Promise<PackingList> => {
    const response = await apiClient.get<PackingList>(`/packing/order/${orderId}`);
    return response.data;
  },

  getPackingList: async (id: string): Promise<PackingList> => {
    const response = await apiClient.get<PackingList>(`/packing/${id}`);
    return response.data;
  },

  updatePackingList: async (id: string, data: PackingListUpdate): Promise<PackingList> => {
    const response = await apiClient.patch<PackingList>(`/packing/${id}`, data);
    return response.data;
  },

  updatePackingItem: async (itemId: string, data: PackingListItemUpdate): Promise<PackingListItem> => {
    const response = await apiClient.patch<PackingListItem>(`/packing/items/${itemId}`, data);
    return response.data;
  },
};
