import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getAdminUserDetail } from '../service/adminUserService';

const useAdminUserDetail = (userId: string) => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_USER_DETAIL, userId],
        queryFn: () => getAdminUserDetail(userId),
        enabled: !!userId,
    });

    return {
        user: data ?? null,
        isLoading,
        isError,
        refetch,
    };
};

export default useAdminUserDetail;
