import { apiClient } from '@/app/lib/axios';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  is_active: boolean;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await apiClient.post<LoginResponse>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  getMe: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }
  },
};
