import { QueryCache, QueryClient } from '@tanstack/react-query';

import { USER_SETTINGS_STORAGE_KEY } from '@shared/constant/USER_SETTINGS_STORAGE_KEY';

import { showWarningToast } from './toastService';

export const queryClient = new QueryClient({
    queryCache: new QueryCache({}),
});

const logCacheError = (label: string, error: unknown): void => {
    if (import.meta.env.DEV) {
        console.error(label, error);
    }
};

export const clearCache = (): void => {
    try {
        queryClient.resetQueries();

        const userSettings = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);

        localStorage.clear();

        if (userSettings) {
            localStorage.setItem(USER_SETTINGS_STORAGE_KEY, userSettings);
        }

        // Disparado a partir do menu lateral (drawer aberto) — toast no topo evita ficar embaixo do overlay do menu.
        showWarningToast('Limpando cache!', { toastId: 'clear-cache', position: 'top' });

        setTimeout(() => {
            location.reload();
        }, 2250);
    } catch (error) {
        logCacheError('Erro ao limpar cache:', error);
    }
};

export const getCache = (key: string[]) => {
    try {
        const cachedData = queryClient.getQueryData(key);

        return cachedData || null;
    } catch (error) {
        logCacheError('Error getting cache:', error);

        return null;
    }
};
