import { useTranslation } from 'react-i18next';

import type { SubscriptionPlan } from '@manga-reader/types';

import PricingCard from '@/shared/component/PricingCard';

import { usePlans } from '@/feature/plans/hook/usePlans';
import useInView from '@/shared/hook/useInView';

const PERIOD_ORDER = ['DAILY', 'MONTHLY', 'ANNUAL'];

export default function Plans() {
    const { t } = useTranslation();

    const { data: plans = [], isLoading, isError } = usePlans();
    const { ref, inView } = useInView();

    const sorted = [...plans].sort(
        (a, b) =>
            PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period),
    );

    function handleSelect(plan: SubscriptionPlan) {
        const appUrl = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173';

        window.location.href = `${appUrl}/subscription?plan=${plan.id}`;
    }

    return (
        <section id="plans" className="py-24 px-4 bg-secondary" ref={ref}>
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        {t('plans.title')}
                    </h2>
                    <p className="text-tertiary">{t('plans.subtitle')}</p>
                </div>
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="h-80 animate-pulse rounded-2xl bg-tertiary/20"
                            />
                        ))}
                    </div>
                ) : isError ? (
                    <p className="text-center text-tertiary">
                        {t('plans.error')}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                        {sorted.map((plan, i) => (
                            <PricingCard
                                key={plan.id}
                                plan={plan}
                                isHighlighted={plan.period === 'MONTHLY'}
                                onSelect={handleSelect}
                                className={
                                    inView
                                        ? `animate-fade-up animate-fade-up-delay-${i + 1}`
                                        : 'animate-hidden'
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
