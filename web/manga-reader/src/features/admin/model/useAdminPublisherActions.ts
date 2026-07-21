import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { showSuccessToast } from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { createPublisher, updatePublisher, deletePublisher } from '../api/adminPublisherService';
import type { CreatePublisherRequest, UpdatePublisherRequest } from '../model/admin.types';

const useAdminPublisherActions = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidatePublishers = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PUBLISHERS] });
    }, [queryClient]);

    const handleCreate = useCallback(
        async (data: CreatePublisherRequest) => {
            setIsSubmitting(true);
            try {
                const result = await createPublisher(data);
                showSuccessToast('Editora criada com sucesso.');
                invalidatePublishers();
                return result;
            } catch {
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidatePublishers],
    );

    const handleUpdate = useCallback(
        async (publisherId: string, data: UpdatePublisherRequest) => {
            setIsSubmitting(true);
            try {
                const result = await updatePublisher(publisherId, data);
                showSuccessToast('Editora atualizada com sucesso.');
                invalidatePublishers();
                return result;
            } catch {
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidatePublishers],
    );

    const handleDelete = useCallback(
        async (publisherId: string) => {
            setIsSubmitting(true);
            try {
                await deletePublisher(publisherId);
                showSuccessToast('Editora excluída com sucesso.');
                invalidatePublishers();
            } catch {
                // Toast de erro já disparado pelo interceptor Axios.
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidatePublishers],
    );

    return { isSubmitting, handleCreate, handleUpdate, handleDelete };
};

export default useAdminPublisherActions;
