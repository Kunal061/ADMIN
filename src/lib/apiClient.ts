import axios, { AxiosHeaders, type AxiosError, type AxiosInstance } from 'axios';
import { storage } from '@/lib/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || '';
const TOKEN_STORAGE_KEY = 'roamana_api_token';

const shouldInvalidateSession = (error: AxiosError) => {
  const status = error.response?.status;
  if (status === 401 || status === 403) return true;
  const message = (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  return /token/i.test(message) && /expired|invalid/i.test(message);
};

const clearAuthStorage = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    storage.setLastActiveUser(null);
  } catch (err) {
    console.error('Failed to clear auth storage', err);
  }
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL || undefined,
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    if (typeof (config.headers as { set?: (key: string, value: string) => void }).set === 'function') {
      (config.headers as { set: (key: string, value: string) => void }).set('Authorization', `Bearer ${token}`);
    } else {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (shouldInvalidateSession(error)) {
      clearAuthStorage();
      if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export const getApiBaseUrl = () => API_BASE_URL;
export const tokenStorageKey = TOKEN_STORAGE_KEY;
