import type { LocalizedString, LocalizedStringList } from '@shared/type/i18n';

export type AdminSubscription = {
    id: string;
    userId: string;
    planPeriod: string;
    planPriceInCents: number;
    startDate: string;
    endDate: string;
    status: string;
    createdAt: string;
};

export type SubscriptionSummary = {
    totalActive: number;
    totalExpired: number;
    totalCancelled: number;
};

export type UpdateSubscriptionStatusRequest = {
    status: string;
};

export type AdminPlan = {
    id: string;
    period: string;
    priceInCents: number;
    description: string;
    features: string[];
    active: boolean;
    prices?: Record<string, number>;
};

export type CreatePlanRequest = {
    period: string;
    priceInCents: number;
    description: LocalizedString;
    features?: LocalizedStringList;
    prices?: Record<string, number>;
};

export type UpdatePlanRequest = {
    priceInCents?: number;
    description?: LocalizedString;
    features?: LocalizedStringList;
    active?: boolean;
    prices?: Record<string, number>;
};

export type GrantSubscriptionRequest = {
    userId: string;
    planId: string;
};

export type SubscriptionAuditLogEntry = {
    id: string;
    subscriptionId: string;
    userId: string;
    action: string;
    performedBy: string | null;
    details: string | null;
    createdAt: string;
};

export type MonthlyGrowthEntry = {
    yearMonth: string;
    newSubscriptions: number;
    cancelledSubscriptions: number;
    netGrowth: number;
};

export type SubscriptionGrowth = {
    entries: MonthlyGrowthEntry[];
    totalNew: number;
    totalCancelled: number;
};
