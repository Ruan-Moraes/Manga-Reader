import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'mr_access_token',
  REFRESH_TOKEN: 'mr_refresh_token',
} as const;

export const tokenStorage = {
  getAccess: () => SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
  getRefresh: () => SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
  setTokens: async (access: string, refresh: string) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  },
};

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenStorage.getRefresh();
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefresh } = data.data;

      await tokenStorage.setTokens(accessToken, newRefresh);
      refreshQueue.forEach((cb) => cb(accessToken));
      refreshQueue = [];

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch {
      await tokenStorage.clear();
      refreshQueue = [];
      // Auth store will handle redirect via its own subscriber
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
