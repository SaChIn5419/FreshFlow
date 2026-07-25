import { apiClient } from '@/app/lib/axios';

export interface Settings {
  id: string;
  company_name: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  logo_url?: string;
  invoice_prefix: string;
  invoice_counter: number;
  currency: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
}

export interface SettingsUpdate {
  company_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  logo_url?: string;
  invoice_prefix?: string;
  currency?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
}

export const settingsService = {
  getSettings: async (): Promise<Settings> => {
    const response = await apiClient.get<Settings>('/settings/');
    return response.data;
  },
  updateSettings: async (data: SettingsUpdate): Promise<Settings> => {
    const response = await apiClient.put<Settings>('/settings/', data);
    return response.data;
  },
};
