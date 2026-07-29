import { create } from 'zustand';
import { authService } from '@/app/services/auth';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (user) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },
  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
  initAuth: async () => {
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
