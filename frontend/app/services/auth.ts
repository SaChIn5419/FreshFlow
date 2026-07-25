import { apiClient } from '@/app/lib/axios';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  is_active: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    // Use native fetch instead of axios to avoid axios's JSON transformRequest
    // intercepting the form-encoded body that OAuth2PasswordRequestForm requires.
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.detail || 'Invalid email or password');
    }

    return response.json();
  },

  getMe: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/auth/me');
    return response.data;
  },
};
