import { useMutation } from '@tanstack/react-query';

import {
    createGiftCode,
    redeemGiftCode,
} from '@/feature/plans/subscriptionService';

export function useCreateGift() {
    return useMutation({
        mutationFn: createGiftCode,
    });
}

export function useRedeemGift() {
    return useMutation({
        mutationFn: redeemGiftCode,
    });
}
