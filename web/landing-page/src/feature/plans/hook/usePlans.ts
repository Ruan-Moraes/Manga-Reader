import { useMutation, useQuery } from '@tanstack/react-query';

import {
    createSubscription,
    fetchSubscriptionPlans,
} from '../subscriptionService';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

export function usePlans(locale?: string) {
    return useQuery({
        queryKey: ['subscription-plans', locale ?? 'default'],
        queryFn: () => fetchSubscriptionPlans(locale),
        staleTime: TEN_MINUTES_MS,
        gcTime: TWO_HOURS_MS,
        retry: 1,
        retryDelay: 250,
    });
}

export function usePurchaseSubscription() {
    return useMutation({
        mutationFn: createSubscription,
    });
}
