import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getRevenueSeries } from '../service/adminPaymentService';

const useRevenueSeries = (months = 12) => {
    const { data, isLoading, isError } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_REVENUE_SERIES, months],
        queryFn: () => getRevenueSeries(months),
        staleTime: 60_000,
    });

    return { data, isLoading, isError };
};

export default useRevenueSeries;
