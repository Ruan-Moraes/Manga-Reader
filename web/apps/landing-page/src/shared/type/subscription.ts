export type SubscriptionPeriod = 'DAILY' | 'MONTHLY' | 'ANNUAL';

/** @deprecated The public API now returns localized feature labels as strings. */
export interface SubscriptionPlanFeature {
    key: string;
    label: string;
}

export interface SubscriptionPlan {
    id: string;
    period: SubscriptionPeriod;
    /** Price in BRL cents (e.g. 1990 = R$19,90) */
    priceInCents: number;
    description: string;
    features: string[];
    active: boolean;
    prices?: Record<string, number>;
}

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    plan: SubscriptionPlan;
    startDate: string;
    endDate: string;
    status: SubscriptionStatus;
    externalPaymentId: string | null;
}

export interface CreateSubscriptionRequest {
    planId: string;
}
