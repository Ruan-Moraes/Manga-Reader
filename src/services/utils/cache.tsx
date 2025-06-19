import { QueryCache, QueryClient } from '@tanstack/react-query';

import { showWarningToast } from '../../utils/toastUtils';

export const queryClient = new QueryClient({
    queryCache: new QueryCache({}),
});

export const clearCache = (): void => {
    try {
        queryClient.resetQueries();
        localStorage.clear();

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
