import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import {
    createEvent,
    updateEvent,
    deleteEvent,
} from '../service/adminEventService';
import type { CreateEventRequest, UpdateEventRequest } from '../type/admin.types';

const useAdminEventActions = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidateEvents = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_EVENTS],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_EVENT_DETAIL],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_DASHBOARD_METRICS],
        });
    }, [queryClient]);

    const handleCreate = useCallback(
        async (data: CreateEventRequest) => {
            setIsSubmitting(true);
            try {
                const result = await createEvent(data);
                showSuccessToast('Evento criado com sucesso.');
                invalidateEvents();
                return result;
            } catch {
                showErrorToast('Erro ao criar evento.');
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateEvents],
    );

    const handleUpdate = useCallback(
        async (eventId: string, data: UpdateEventRequest) => {
            setIsSubmitting(true);
            try {
                const result = await updateEvent(eventId, data);
                showSuccessToast('Evento atualizado com sucesso.');
                invalidateEvents();
                return result;
            } catch {
                showErrorToast('Erro ao atualizar evento.');
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateEvents],
    );

    const handleDelete = useCallback(
        async (eventId: string) => {
            setIsSubmitting(true);
            try {
                await deleteEvent(eventId);
                showSuccessToast('Evento excluído com sucesso.');
                invalidateEvents();
            } catch {
                showErrorToast('Erro ao excluir evento.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateEvents],
    );

    return {
        isSubmitting,
        handleCreate,
        handleUpdate,
        handleDelete,
    };
};

export default useAdminEventActions;
