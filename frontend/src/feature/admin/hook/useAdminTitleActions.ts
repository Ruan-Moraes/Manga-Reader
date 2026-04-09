import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import {
    createTitle,
    updateTitle,
    deleteTitle,
} from '../service/adminTitleService';
import type { CreateTitleRequest, UpdateTitleRequest } from '../type/admin.types';

const useAdminTitleActions = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidateTitles = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_TITLES],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_TITLE_DETAIL],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_DASHBOARD_METRICS],
        });
    }, [queryClient]);

    const handleCreate = useCallback(
        async (data: CreateTitleRequest) => {
            setIsSubmitting(true);
            try {
                const result = await createTitle(data);
                showSuccessToast('Título criado com sucesso.');
                invalidateTitles();
                return result;
            } catch {
                showErrorToast('Erro ao criar título.');
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateTitles],
    );

    const handleUpdate = useCallback(
        async (titleId: string, data: UpdateTitleRequest) => {
            setIsSubmitting(true);
            try {
                const result = await updateTitle(titleId, data);
                showSuccessToast('Título atualizado com sucesso.');
                invalidateTitles();
                return result;
            } catch {
                showErrorToast('Erro ao atualizar título.');
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateTitles],
    );

    const handleDelete = useCallback(
        async (titleId: string) => {
            setIsSubmitting(true);
            try {
                await deleteTitle(titleId);
                showSuccessToast('Título excluído com sucesso.');
                invalidateTitles();
            } catch {
                showErrorToast('Erro ao excluir título.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateTitles],
    );

    return {
        isSubmitting,
        handleCreate,
        handleUpdate,
        handleDelete,
    };
};

export default useAdminTitleActions;
