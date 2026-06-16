import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { createAuthor, updateAuthor, deleteAuthor } from '../api/adminAuthorService';
import type { CreateAuthorRequest, UpdateAuthorRequest } from '../model/admin.types';

const useAdminAuthorActions = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidateAuthors = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_AUTHORS] });
    }, [queryClient]);

    const handleCreate = useCallback(
        async (data: CreateAuthorRequest) => {
            setIsSubmitting(true);
            try {
                const result = await createAuthor(data);
                showSuccessToast('Autor criado com sucesso.');
                invalidateAuthors();
                return result;
            } catch {
                showErrorToast('Erro ao criar autor.');
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateAuthors],
    );

    const handleUpdate = useCallback(
        async (authorId: string, data: UpdateAuthorRequest) => {
            setIsSubmitting(true);
            try {
                const result = await updateAuthor(authorId, data);
                showSuccessToast('Autor atualizado com sucesso.');
                invalidateAuthors();
                return result;
            } catch {
                showErrorToast('Erro ao atualizar autor.');
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateAuthors],
    );

    const handleDelete = useCallback(
        async (authorId: string) => {
            setIsSubmitting(true);
            try {
                await deleteAuthor(authorId);
                showSuccessToast('Autor excluído com sucesso.');
                invalidateAuthors();
            } catch {
                showErrorToast('Erro ao excluir autor.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateAuthors],
    );

    return { isSubmitting, handleCreate, handleUpdate, handleDelete };
};

export default useAdminAuthorActions;
