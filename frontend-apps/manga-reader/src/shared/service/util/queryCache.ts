import { QueryCache, QueryClient } from '@tanstack/react-query';

import { USER_SETTINGS_STORAGE_KEY } from '@shared/constant/USER_SETTINGS_STORAGE_KEY';

import { showWarningToast } from './toastService';

export const queryClient = new QueryClient({
    queryCache: new QueryCache({}),
});

export const clearCache = (): void => {
    try {
        queryClient.resetQueries();

        const userSettings = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);

        localStorage.clear();

        if (userSettings) {
            localStorage.setItem(USER_SETTINGS_STORAGE_KEY, userSettings);
        }

        showWarningToast('Limpando cache!', { toastId: 'clear-cache' });

        setTimeout(() => {
            location.reload();
        }, 2250);
    } catch (error) {
        console.error('Erro ao limpar cache:', error);
    }
};

export const getCache = (key: string[]) => {
    try {
        const cachedData = queryClient.getQueryData(key);

        return cachedData || null;
    } catch (error) {
        console.error('Error getting cache:', error);

        return null;
    }
};
