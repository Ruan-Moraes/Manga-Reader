import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getSubscriptionGrowth } from '../service/adminSubscriptionService';

const useSubscriptionGrowth = (months = 12) => {
    const { data, isLoading, isError } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_SUBSCRIPTION_GROWTH, months],
        queryFn: () => getSubscriptionGrowth(months),
        staleTime: 60_000,
    });

    return { data, isLoading, isError };
};

export default useSubscriptionGrowth;
