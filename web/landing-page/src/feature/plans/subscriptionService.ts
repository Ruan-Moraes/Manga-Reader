import type {
    ApiResponse,
    CreateGiftCodeRequest,
    CreateSubscriptionRequest,
    GiftCode,
    RedeemGiftCodeRequest,
    Subscription,
    SubscriptionPlan,
} from '@manga-reader/types';

import httpClient from '@/shared/service/httpClient';

const SUBSCRIPTION_PERIODS = new Set(['DAILY', 'MONTHLY', 'ANNUAL']);

function isSubscriptionPlan(value: unknown): value is SubscriptionPlan {
    if (!value || typeof value !== 'object') return false;

    const plan = value as Record<string, unknown>;

    return (
        typeof plan.id === 'string' &&
        typeof plan.period === 'string' &&
        SUBSCRIPTION_PERIODS.has(plan.period) &&
        typeof plan.priceInCents === 'number' &&
        Number.isSafeInteger(plan.priceInCents) &&
        plan.priceInCents >= 0 &&
        typeof plan.description === 'string' &&
        Array.isArray(plan.features) &&
        plan.features.every(feature => typeof feature === 'string') &&
        typeof plan.active === 'boolean'
    );
}

export async function fetchSubscriptionPlans(
    locale?: string,
): Promise<SubscriptionPlan[]> {
    const res = await httpClient.get<ApiResponse<unknown>>(
        '/subscription-plans',
        locale
            ? {
                  headers: { 'Accept-Language': locale },
              }
            : undefined,
    );

    const plans = res.data.data;

    if (
        !res.data.success ||
        !Array.isArray(plans) ||
        !plans.every(isSubscriptionPlan)
    ) {
        throw new Error('Invalid subscription plans response');
    }

    return plans;
}

export async function createSubscription(
    data: CreateSubscriptionRequest,
): Promise<Subscription> {
    const res = await httpClient.post<ApiResponse<Subscription>>(
        '/subscriptions',
        data,
    );

    return res.data.data;
}

export async function createGiftCode(
    data: CreateGiftCodeRequest,
): Promise<GiftCode> {
    const res = await httpClient.post<ApiResponse<GiftCode>>(
        '/subscriptions/gift',
        data,
    );

    return res.data.data;
}

export async function redeemGiftCode(
    data: RedeemGiftCodeRequest,
): Promise<Subscription> {
    const res = await httpClient.post<ApiResponse<Subscription>>(
        '/subscriptions/redeem',
        data,
    );

    return res.data.data;
}
