import { apiClient } from '@/app/lib/axios';

export interface InvoiceItemCreate {
  order_item_id: string;
  quantity: number; // Final quantity
  unit_price: number;
}

export interface InvoiceCreate {
  order_id: string;
  items: InvoiceItemCreate[];
}

export interface Invoice {
  id: string;
  order_id: string;
  customer_id: string;
  invoice_number: string;
  subtotal: number;
  gst: number;
  grand_total: number;
  status: string;
  due_date?: string;
  paid_amount: number;
  balance_due: number;
  payment_status: string;
  created_at: string;
  customer?: { id: string; restaurant_name: string };
}

export const invoiceService = {
  generateInvoice: async (data: InvoiceCreate): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>('/invoices/', data);
    return response.data;
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const response = await apiClient.get<Invoice[]>('/invoices/');
    return response.data;
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },
};
