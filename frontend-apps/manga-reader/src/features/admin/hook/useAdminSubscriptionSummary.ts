import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getSubscriptionSummary } from '../service/adminSubscriptionService';

const useAdminSubscriptionSummary = () => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_SUBSCRIPTION_SUMMARY],
        queryFn: getSubscriptionSummary,
        staleTime: 60_000,
    });

    return {
        summary: data ?? null,
        isLoading,
        isError,
        refetch,
    };
};

export default useAdminSubscriptionSummary;
