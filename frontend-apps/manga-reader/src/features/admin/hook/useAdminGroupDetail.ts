import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getAdminGroupDetail } from '../service/adminGroupService';

const useAdminGroupDetail = (groupId: string) => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_GROUP_DETAIL, groupId],
        queryFn: () => getAdminGroupDetail(groupId),
        enabled: !!groupId,
    });

    return {
        group: data ?? null,
        isLoading,
        isError,
        refetch,
    };
};

export default useAdminGroupDetail;
