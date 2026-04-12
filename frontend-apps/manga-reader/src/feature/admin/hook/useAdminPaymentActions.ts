import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { updatePaymentStatus } from '../service/adminPaymentService';

const useAdminPaymentActions = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidatePayments = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_PAYMENTS],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_PAYMENT_DETAIL],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_FINANCIAL_SUMMARY],
        });
    }, [queryClient]);

    const handleUpdateStatus = useCallback(
        async (paymentId: string, status: string) => {
            setIsSubmitting(true);
            try {
                await updatePaymentStatus(paymentId, { status });
                showSuccessToast('Status do pagamento atualizado com sucesso.');
                invalidatePayments();
            } catch {
                showErrorToast('Erro ao atualizar status do pagamento.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidatePayments],
    );

    return {
        isSubmitting,
        handleUpdateStatus,
    };
};

export default useAdminPaymentActions;
