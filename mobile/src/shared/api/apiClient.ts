import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { getCurrentLanguage } from '@/src/shared/i18n';

import { notifyAuthExpired } from './authExpired';
import { tokenStorage } from './tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
const REQUEST_TIMEOUT_MS = 15000;

export const api = axios.create({
    baseURL: `${BASE_URL}/api`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
        'X-Refresh-Token-Transport': 'body',
    },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccess();

    config.headers['Accept-Language'] = getCurrentLanguage();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

type QueuedRequest = {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
};

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let refreshQueue: QueuedRequest[] = [];

const resolveRefreshQueue = (token: string) => {
    refreshQueue.forEach(({ resolve }) => resolve(token));
    refreshQueue = [];
};

const rejectRefreshQueue = (error: unknown) => {
    refreshQueue.forEach(({ reject }) => reject(error));
    refreshQueue = [];
};

const isAuthEndpointWithoutRetry = (url: string): boolean => url.includes('/auth/') && !url.includes('/auth/me');

api.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetriableConfig;
        const url = originalRequest.url ?? '';

        if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpointWithoutRetry(url)) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshQueue.push({
                    resolve: token => {
                        originalRequest._retry = true;
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    },
                    reject,
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = await tokenStorage.getRefresh();

            if (!refreshToken) {
                throw new Error('Missing refresh token');
            }

            const { data } = await axios.post(
                `${BASE_URL}/api/auth/refresh`,
                { refreshToken },
                {
                    headers: { 'Accept-Language': getCurrentLanguage() },
                    timeout: REQUEST_TIMEOUT_MS,
                },
            );
            const { accessToken, refreshToken: newRefresh } = data.data;

            await tokenStorage.setTokens(accessToken, newRefresh);

            resolveRefreshQueue(accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            return api(originalRequest);
        } catch (refreshError) {
            await tokenStorage.clear();

            rejectRefreshQueue(refreshError);

            notifyAuthExpired();

            return Promise.reject(error);
        } finally {
            isRefreshing = false;
        }
    },
);
