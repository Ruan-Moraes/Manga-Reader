import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { showSuccessToast } from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { changeGroupMemberRole, deleteGroup, removeGroupMember, updateAdminGroup, type UpdateGroupRequest } from '../api/adminGroupService';

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
                // Toast de erro já disparado pelo interceptor Axios.
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
                // Toast de erro já disparado pelo interceptor Axios.
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateGroups],
    );

    const handleUpdate = useCallback(
        async (groupId: string, data: UpdateGroupRequest) => {
            setIsSubmitting(true);
            try {
                const result = await updateAdminGroup(groupId, data);
                showSuccessToast('Grupo atualizado com sucesso.');
                invalidateGroups();
                return result;
            } catch {
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidateGroups],
    );

    const handleDelete = useCallback(
        async (groupId: string) => {
            setIsSubmitting(true);
            try {
                await deleteGroup(groupId);
                showSuccessToast('Grupo removido com sucesso.');
                invalidateGroups();
            } catch {
                // Toast de erro já disparado pelo interceptor Axios.
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
        handleUpdate,
        handleDelete,
    };
};

export default useAdminGroupActions;
