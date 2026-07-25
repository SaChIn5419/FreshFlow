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
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if it exists
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiUrl();
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401s
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error("Your session has expired. Please log in again.");
      }
    } else if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        toast.error("You don't have permission for this action.");
      } else if (status === 404) {
        toast.error("The requested resource no longer exists.");
      } else if (status === 422) {
        toast.error("Please check your inputs and try again.");
      } else if (status >= 500) {
        toast.error("FreshFlow server encountered an error. We are looking into it.");
      }
    } else if (error.request) {
      toast.error("Cannot connect to FreshFlow server. Please check your internet connection.");
    }
    
    return Promise.reject(error);
  }
);
