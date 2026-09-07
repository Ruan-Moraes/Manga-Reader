import { QueryCache, QueryClient } from '@tanstack/react-query';

import { showWarningToast } from './toastService';

export const queryClient = new QueryClient({
    queryCache: new QueryCache({}),
});

const logCacheError = (label: string, error: unknown): void => {
    if (import.meta.env.DEV) {
        console.error(label, error);
    }
};

export type ClientCacheUsage = { usedBytes: number; quotaBytes: number };

export const measureClientCache = async (): Promise<ClientCacheUsage> => {
    if (!navigator.storage?.estimate) return { usedBytes: 0, quotaBytes: 0 };
    const estimate = await navigator.storage.estimate();
    return { usedBytes: estimate.usage ?? 0, quotaBytes: estimate.quota ?? 0 };
};

/** Limpa caches reais da aplicação, sem apagar sessão nem preferências. */
export const clearClientCache = async (): Promise<void> => {
    queryClient.clear();
    if ('caches' in window) {
        const keys = await window.caches.keys();
        const results = await Promise.all(keys.map(key => window.caches.delete(key)));
        if (results.some(deleted => !deleted)) throw new Error('One or more CacheStorage entries could not be deleted');
    }
};

export const clearCache = (): void => {
    void clearClientCache()
        .then(() => showWarningToast('Cache limpo', { toastId: 'clear-cache', position: 'top' }))
        .catch(error => logCacheError('Erro ao limpar cache:', error));
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
