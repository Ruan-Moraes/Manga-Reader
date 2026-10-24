import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { showSuccessToast } from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { createNews, updateNews, deleteNews, publishNews, unpublishNews, moveNewsToDraft, scheduleNews } from '../api/adminNewsService';
import type { CreateNewsRequest, UpdateNewsRequest } from '../model/admin.types';

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
                // Toast de erro já disparado pelo interceptor Axios.
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateNews],
    );

    const changeStatus = useCallback(async (action: () => Promise<unknown>) => {
        setIsSubmitting(true);
        try {
            const result = await action();
            invalidateNews();
            return result;
        } catch {
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, [invalidateNews]);

    return {
        isSubmitting,
        handleCreate,
        handleUpdate,
        handleDelete,
        handlePublish: (id: string) => changeStatus(() => publishNews(id)),
        handleUnpublish: (id: string) => changeStatus(() => unpublishNews(id)),
        handleDraft: (id: string) => changeStatus(() => moveNewsToDraft(id)),
        handleSchedule: (id: string, scheduledAt: string) => changeStatus(() => scheduleNews(id, scheduledAt)),
    };
};

export default useAdminNewsActions;
