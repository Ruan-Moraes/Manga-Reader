import type { SubscriptionPlan } from "./subscription";

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

export interface CreateGiftCodeRequest {
    planId: string;
    recipientEmail: string;
}

export interface RedeemGiftCodeRequest {
    code: string;
}
