import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import {
    banUser,
    changeUserRole,
    unbanUser,
} from '../service/adminUserService';
import type { BanUserRequest } from '../type/admin.types';

const useAdminUserActions = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidateUsers = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_USERS],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_USER_DETAIL],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_DASHBOARD_METRICS],
        });
    }, [queryClient]);

    const handleChangeRole = useCallback(
        async (userId: string, role: string) => {
            setIsSubmitting(true);
            try {
                await changeUserRole(userId, { role });
                showSuccessToast('Role alterado com sucesso.');
                invalidateUsers();
            } catch {
                showErrorToast('Erro ao alterar role.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateUsers],
    );

    const handleBan = useCallback(
        async (userId: string, data: BanUserRequest) => {
            setIsSubmitting(true);
            try {
                await banUser(userId, data);
                showSuccessToast('Usuário banido com sucesso.');
                invalidateUsers();
            } catch {
                showErrorToast('Erro ao banir usuário.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateUsers],
    );

    const handleUnban = useCallback(
        async (userId: string) => {
            setIsSubmitting(true);
            try {
                await unbanUser(userId);
                showSuccessToast('Ban removido com sucesso.');
                invalidateUsers();
            } catch {
                showErrorToast('Erro ao remover ban.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateUsers],
    );

    return {
        isSubmitting,
        handleChangeRole,
        handleBan,
        handleUnban,
    };
};

export default useAdminUserActions;
