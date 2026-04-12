import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import {
    changeGroupMemberRole,
    removeGroupMember,
} from '../service/adminGroupService';

const useAdminGroupActions = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidateGroups = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_GROUPS],
        });
        queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ADMIN_GROUP_DETAIL],
        });
    }, [queryClient]);

    const handleChangeRole = useCallback(
        async (groupId: string, userId: string, role: string) => {
            setIsSubmitting(true);
            try {
                await changeGroupMemberRole(groupId, userId, { role });
                showSuccessToast('Role do membro alterado com sucesso.');
                invalidateGroups();
            } catch {
                showErrorToast('Erro ao alterar role do membro.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateGroups],
    );

    const handleRemoveMember = useCallback(
        async (groupId: string, userId: string) => {
            setIsSubmitting(true);
            try {
                await removeGroupMember(groupId, userId);
                showSuccessToast('Membro removido com sucesso.');
                invalidateGroups();
            } catch {
                showErrorToast('Erro ao remover membro.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateGroups],
    );

    return {
        isSubmitting,
        handleChangeRole,
        handleRemoveMember,
    };
};

export default useAdminGroupActions;
