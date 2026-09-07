import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { showSuccessToast } from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { updateSubscriptionStatus } from '../api/adminSubscriptionService';

const useAdminSubscriptionActions = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidateSubscriptions = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_SUBSCRIPTIONS],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_SUBSCRIPTION_SUMMARY],
        });
    }, [queryClient]);

    const handleUpdateStatus = useCallback(
        async (subscriptionId: string, status: string) => {
            setIsSubmitting(true);
            try {
                await updateSubscriptionStatus(subscriptionId, { status });
                showSuccessToast('Status da assinatura atualizado com sucesso.');
                invalidateSubscriptions();
            } catch {
                // Toast de erro já disparado pelo interceptor Axios.
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateSubscriptions],
    );

    return {
        isSubmitting,
        handleUpdateStatus,
    };
};

export default useAdminSubscriptionActions;
