import type { SubscriptionPeriod, SubscriptionPlan } from '@toonlira/types';
import { useTranslation } from 'react-i18next';

import { appHref } from '@/shared/config/appLinks';
import type { PlanView } from '@/shared/data/landing';

const PERIOD_ORDER: SubscriptionPeriod[] = ['DAILY', 'MONTHLY', 'ANNUAL'];

const PERIOD_SUFFIX_KEY: Record<SubscriptionPeriod, string> = {
    DAILY: 'plans.perDay',
    MONTHLY: 'plans.perMonth',
    ANNUAL: 'plans.perYear',
};

export interface PlanCardItem {
    period: SubscriptionPeriod;
    view: PlanView;
    redirectId: string;
}

export function formatPrice(cents: number, locale = 'pt-BR'): string {
    return (cents / 100).toLocaleString(locale, {
        style: 'currency',
        currency: 'BRL',
    });
}

export function buildPlanCards(
    plans: SubscriptionPlan[],
    t: (key: string) => string,
    locale: string,
): PlanCardItem[] {
    const sorted = [...plans]
        .filter(plan => plan.active)
        .sort(
            (a, b) =>
                PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period),
        );

    return sorted.map(plan => ({
        period: plan.period,
        view: {
            name: t(`plans.periodName.${plan.period.toLowerCase()}`),
            price: formatPrice(plan.priceInCents, locale),
            period: t(PERIOD_SUFFIX_KEY[plan.period]),
            description: plan.description,
            features: plan.features,
        },
        redirectId: plan.id,
    }));
}

export function usePlanCards(plans: SubscriptionPlan[]) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language ?? 'pt-BR';

    const cards = buildPlanCards(plans, t, locale);

    function selectPlan(redirectId: string) {
        window.location.href = appHref('/subscription', { plan: redirectId });
    }

    return { cards, selectPlan };
}
