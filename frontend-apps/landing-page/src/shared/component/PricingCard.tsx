import type { SubscriptionPlan } from '@manga-reader/types';
import { useTranslation } from 'react-i18next';

interface PricingCardProps {
    plan: SubscriptionPlan;
    isHighlighted?: boolean;
    onSelect: (plan: SubscriptionPlan) => void;
    className?: string;
}

function formatPrice(cents: number, locale = 'pt-BR'): string {
    return (cents / 100).toLocaleString(locale, {
        style: 'currency',
        currency: 'BRL',
    });
}

const PERIOD_SUFFIX_KEY: Record<string, string> = {
    DAILY: 'plans.per_day',
    MONTHLY: 'plans.per_month',
    ANNUAL: 'plans.per_year',
};

export default function PricingCard({
    plan,
    isHighlighted = false,
    onSelect,
    className = '',
}: PricingCardProps) {
    const { t } = useTranslation();

    const suffixKey = PERIOD_SUFFIX_KEY[plan.period] ?? 'plans.per_month';

    return (
        <article
            className={`relative flex flex-col rounded-2xl p-6 border transition-all ${
                isHighlighted
                    ? 'bg-secondary border-accent shadow-[0.25rem_0.25rem_0_0_var(--color-accent-muted)]'
                    : 'bg-secondary border-tertiary'
            } ${className}`}
        >
            {isHighlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-primary">
                    {t('plans.most_popular')}
                </span>
            )}
            <h3 className="mb-1 text-lg font-bold text-white capitalize">
                {t(`plans.period.${plan.period.toLowerCase()}`)}
            </h3>
            <div className="mt-2 mb-4">
                <span className="text-4xl font-extrabold text-accent">
                    {formatPrice(plan.priceInCents)}
                </span>
                <span className="ml-1 text-sm text-tertiary">
                    {t(suffixKey)}
                </span>
            </div>
            <p className="mb-4 text-sm text-tertiary">{plan.description}</p>
            <ul className="flex-1 mb-6 space-y-2" role="list">
                <li className="text-xs font-semibold tracking-wider uppercase text-tertiary">
                    {t('plans.feature_list_title')}
                </li>
                {plan.features.map(feature => (
                    <li
                        key={feature.key}
                        className="flex items-center gap-2 text-sm text-white"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="flex-shrink-0 w-4 h-4 text-accent"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {feature.label}
                    </li>
                ))}
            </ul>
            <button
                onClick={() => onSelect(plan)}
                className={`w-full rounded-lg py-3 font-bold text-sm transition-colors ${
                    isHighlighted
                        ? 'bg-accent text-primary hover:bg-accent-hover'
                        : 'bg-transparent border border-accent text-accent hover:bg-accent-subtle'
                }`}
            >
                {t('plans.cta')}
            </button>
        </article>
    );
}
