"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1, // Be careful retrying mutations to avoid duplicate transactions
      }
    }
  }));
  const initAuth = useAuth((state) => state.initAuth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      initAuth();
    }
    setIsInitialized(true);
  }, [initAuth]);

  if (!isInitialized) return null; // Avoid hydration mismatch by waiting for client render

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
