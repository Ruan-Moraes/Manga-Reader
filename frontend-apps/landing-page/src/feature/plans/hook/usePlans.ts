import { useMutation, useQuery } from '@tanstack/react-query';

import {
    createSubscription,
    fetchSubscriptionPlans,
} from '../subscriptionService';

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function usePlans() {
    return useQuery({
        queryKey: ['subscription-plans'],
        queryFn: fetchSubscriptionPlans,
        staleTime: ONE_HOUR_MS,
        gcTime: TWO_HOURS_MS,
    });
}

export function usePurchaseSubscription() {
    return useMutation({
        mutationFn: createSubscription,
    });
}
