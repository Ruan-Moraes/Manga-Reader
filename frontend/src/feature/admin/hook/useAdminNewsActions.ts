import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import {
    createNews,
    updateNews,
    deleteNews,
} from '../service/adminNewsService';
import type { CreateNewsRequest, UpdateNewsRequest } from '../type/admin.types';

const useAdminNewsActions = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidateNews = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_NEWS],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_NEWS_DETAIL],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_DASHBOARD_METRICS],
        });
    }, [queryClient]);

    const handleCreate = useCallback(
        async (data: CreateNewsRequest) => {
            setIsSubmitting(true);
            try {
                const result = await createNews(data);
                showSuccessToast('Notícia criada com sucesso.');
                invalidateNews();
                return result;
            } catch {
                showErrorToast('Erro ao criar notícia.');
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateNews],
    );

    const handleUpdate = useCallback(
        async (newsId: string, data: UpdateNewsRequest) => {
            setIsSubmitting(true);
            try {
                const result = await updateNews(newsId, data);
                showSuccessToast('Notícia atualizada com sucesso.');
                invalidateNews();
                return result;
            } catch {
                showErrorToast('Erro ao atualizar notícia.');
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateNews],
    );

    const handleDelete = useCallback(
        async (newsId: string) => {
            setIsSubmitting(true);
            try {
                await deleteNews(newsId);
                showSuccessToast('Notícia excluída com sucesso.');
                invalidateNews();
            } catch {
                showErrorToast('Erro ao excluir notícia.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateNews],
    );

    return {
        isSubmitting,
        handleCreate,
        handleUpdate,
        handleDelete,
    };
};

export default useAdminNewsActions;
