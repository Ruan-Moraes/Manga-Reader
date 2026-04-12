import type { SubscriptionPlan } from '@manga-reader/types';

let idCounter = 0;

export function buildPlan(
    overrides: Partial<SubscriptionPlan> = {},
): SubscriptionPlan {
    idCounter += 1;
    return {
        id: `plan-${idCounter}`,
        period: 'MONTHLY',
        priceInCents: 1990,
        description: 'Test plan description',
        features: [
            { key: 'feature-a', label: 'Feature A' },
            { key: 'feature-b', label: 'Feature B' },
        ],
        active: true,
        ...overrides,
    };
}
