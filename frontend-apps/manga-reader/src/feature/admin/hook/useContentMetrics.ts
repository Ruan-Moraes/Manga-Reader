import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getContentMetrics } from '../service/adminDashboardService';

const useContentMetrics = () => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_DASHBOARD_CONTENT_METRICS],
        queryFn: getContentMetrics,
        staleTime: 60_000,
    });

    return {
        metrics: data ?? null,
        isLoading,
        isError,
        refetch,
    };
};

export default useContentMetrics;
