import axios from 'axios';
import { toast } from 'sonner';

export const getApiUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  url = url.trim().replace(/\/+$/, '');
  
  // Mandatory protocol check: If missing http:// or https://, prepend https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Mandatory path check: Ensure /api/v1 is present
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  
  return url;
};

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'FreshFlow',
  },
});

// Request Interceptor: Attach Bearer token & CSRF header & set baseURL
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiUrl();
    config.withCredentials = true;

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          (config.headers as any)['Authorization'] = `Bearer ${token}`;
        }
      }
    }

    if (typeof config.headers.set === 'function') {
      config.headers.set('X-Requested-With', 'FreshFlow');
    } else {
      (config.headers as any)['X-Requested-With'] = 'FreshFlow';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Automatic Refresh Token Rotation on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        const res = await apiClient.post('/auth/refresh', refreshToken ? { body_refresh_token: refreshToken } : {});
        
        if (typeof window !== 'undefined' && res.data?.access_token) {
          localStorage.setItem('access_token', res.data.access_token);
          if (res.data.refresh_token) {
            localStorage.setItem('refresh_token', res.data.refresh_token);
          }
          originalRequest.headers['Authorization'] = `Bearer ${res.data.access_token}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshErr) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error("Your session has expired. Please log in again.");
        }
        return Promise.reject(refreshErr);
      }
    }

    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && !originalRequest?.url?.includes('/auth/me')) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error("Your session has expired. Please log in again.");
        }
      } else if (status === 403) {
        toast.error("You don't have permission for this action.");
      } else if (status === 404) {
        toast.error("The requested resource no longer exists.");
      } else if (status === 422) {
        toast.error("Please check your inputs and try again.");
      } else if (status === 503) {
        toast.error("Database service is temporarily unavailable. Please try again shortly.");
      } else if (status >= 500) {
        toast.error("FreshFlow server encountered an error. We are looking into it.");
      }
    } else if (error.request && !originalRequest?.url?.includes('/auth/refresh')) {
      toast.error("Server unavailable, please try again shortly.");
    }

    return Promise.reject(error);
  }
);
