import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getDashboardMetrics } from '../service/adminDashboardService';

const useDashboardMetrics = () => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_DASHBOARD_METRICS],
        queryFn: getDashboardMetrics,
        staleTime: 60_000,
    });

    return {
        metrics: data ?? null,
        isLoading,
        isError,
        refetch,
    };
};

export default useDashboardMetrics;
