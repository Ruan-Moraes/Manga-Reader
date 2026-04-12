import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { createTag, updateTag, deleteTag } from '../service/adminTagService';
import type { CreateTagRequest, UpdateTagRequest } from '../type/admin.types';

const useAdminTagActions = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidateTags = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_TAGS],
        });
    }, [queryClient]);

    const handleCreate = useCallback(
        async (data: CreateTagRequest) => {
            setIsSubmitting(true);
            try {
                const result = await createTag(data);
                showSuccessToast('Tag criada com sucesso.');
                invalidateTags();
                return result;
            } catch {
                showErrorToast('Erro ao criar tag.');
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateTags],
    );

    const handleUpdate = useCallback(
        async (tagId: number, data: UpdateTagRequest) => {
            setIsSubmitting(true);
            try {
                const result = await updateTag(tagId, data);
                showSuccessToast('Tag atualizada com sucesso.');
                invalidateTags();
                return result;
            } catch {
                showErrorToast('Erro ao atualizar tag.');
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateTags],
    );

    const handleDelete = useCallback(
        async (tagId: number) => {
            setIsSubmitting(true);
            try {
                await deleteTag(tagId);
                showSuccessToast('Tag excluída com sucesso.');
                invalidateTags();
            } catch {
                showErrorToast('Erro ao excluir tag.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateTags],
    );

    return { isSubmitting, handleCreate, handleUpdate, handleDelete };
};

export default useAdminTagActions;
