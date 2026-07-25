import axios from 'axios';
import { toast } from 'sonner';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if it exists
apiClient.interceptors.request.use(
  (config) => {
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
      
      // For now, if we get a 401, clear the token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error("Your session has expired. Please log in again.");
      }
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
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
      // The request was made but no response was received (Network Down)
      toast.error("Cannot connect to FreshFlow server. Please check your internet connection.");
    }
    
    return Promise.reject(error);
  }
);
