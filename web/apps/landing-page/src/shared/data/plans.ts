export interface PlanMeta {
    accent: boolean;
    ribbon?: boolean;
}

export const PLANS_META: Record<
    'DAILY' | 'MONTHLY' | 'ANNUAL',
    PlanMeta
> = {
    DAILY: { accent: false },
    MONTHLY: { accent: true },
    ANNUAL: { accent: false, ribbon: true },
};

export interface PlanView {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
}
