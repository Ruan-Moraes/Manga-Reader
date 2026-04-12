import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { createPlan, updatePlan } from '../service/adminSubscriptionService';
import type { CreatePlanRequest, UpdatePlanRequest } from '../type/admin.types';

const useAdminPlanActions = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidatePlans = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PLANS] });
    }, [queryClient]);

    const handleCreate = useCallback(
        async (data: CreatePlanRequest) => {
            setIsSubmitting(true);
            try {
                await createPlan(data);
                showSuccessToast('Plano criado com sucesso.');
                invalidatePlans();
            } catch {
                showErrorToast('Erro ao criar plano.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidatePlans],
    );

    const handleUpdate = useCallback(
        async (id: string, data: UpdatePlanRequest) => {
            setIsSubmitting(true);
            try {
                await updatePlan(id, data);
                showSuccessToast('Plano atualizado com sucesso.');
                invalidatePlans();
            } catch {
                showErrorToast('Erro ao atualizar plano.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidatePlans],
    );

    return {
        isSubmitting,
        handleCreate,
        handleUpdate,
    };
};

export default useAdminPlanActions;
