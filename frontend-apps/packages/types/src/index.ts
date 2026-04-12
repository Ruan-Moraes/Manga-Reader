// ─── Generic API Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message: string;
    statusCode: number;
}

export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

// ─── Public Stats ─────────────────────────────────────────────────────────────

export interface PublicStats {
    totalTitles: number;
    totalChapters: number;
}

// ─── Subscription Plans ───────────────────────────────────────────────────────

export type SubscriptionPeriod = 'DAILY' | 'MONTHLY' | 'ANNUAL';

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
    features: SubscriptionPlanFeature[];
    active: boolean;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

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

// ─── Gift Codes ───────────────────────────────────────────────────────────────

export type GiftCodeStatus = 'PENDING' | 'REDEEMED' | 'EXPIRED';

export interface GiftCode {
    id: string;
    code: string;
    planId: string;
    plan: SubscriptionPlan;
    senderUserId: string;
    recipientEmail: string;
    redeemedByUserId: string | null;
    redeemedAt: string | null;
    expiresAt: string;
    status: GiftCodeStatus;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateSubscriptionRequest {
    planId: string;
}

export interface CreateGiftCodeRequest {
    planId: string;
    recipientEmail: string;
}

export interface RedeemGiftCodeRequest {
    code: string;
}
