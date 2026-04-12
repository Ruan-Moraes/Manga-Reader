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

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const res = await httpClient.get<ApiResponse<SubscriptionPlan[]>>(
        '/subscription-plans',
    );

    return res.data.data;
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
