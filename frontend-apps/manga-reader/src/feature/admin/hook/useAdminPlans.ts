import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getAdminPlans } from '../service/adminSubscriptionService';

const useAdminPlans = () => {
    const [page, setPage] = useState(0);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_PLANS, page],
        queryFn: () => getAdminPlans(page, 20),
    });

    return {
        plans: data?.content ?? [],
        page,
        totalPages: data?.totalPages ?? 0,
        totalElements: data?.totalElements ?? 0,
        isLoading,
        isError,
        setPage,
        refetch,
    };
};

export default useAdminPlans;
