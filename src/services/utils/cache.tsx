import {QueryCache, QueryClient} from "@tanstack/react-query";

import {toast} from "react-toastify";

export const queryClient = new QueryClient({
    queryCache: new QueryCache({}),
});

export const clearCache = (): void => {
    try {
        queryClient.resetQueries();
        localStorage.clear();

        toast.warning('Limpando cache!');

        setTimeout(() => {
            location.reload();
        }, 750);
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