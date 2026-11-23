import { useTranslation } from 'react-i18next';

import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import PricingCard from '@/shared/component/PricingCard';
import Reveal from '@/shared/component/Reveal';
import { useLocale } from '@/shared/hook/useLocale';
import { usePlans } from '@/feature/plans/hook/usePlans';
import { PLANS_META } from '@/shared/data/landing';

import { PlanSkeleton } from './plans/PlanSkeleton';
import { PlansTrustBar } from './plans/PlansTrustBar';
import { PlansUnavailable } from './plans/PlansUnavailable';
import { usePlanCards } from './plans/usePlanCards';

export default function Plans() {
    const { t } = useTranslation();
    const locale = useLocale();

    const {
        data: apiPlans = [],
        isError,
        isFetching,
        isLoading,
        refetch,
    } = usePlans(locale);

    const { cards, selectPlan } = usePlanCards(apiPlans);
    const plansUnavailable = isError || (!isLoading && cards.length === 0);

    return (
        <MarketingSection id="plans" tone="raised">
            <SectionHeading
                eyebrow={t('plans.eyebrow')}
                title={t('plans.title')}
                description={t('plans.sub')}
            />
            <div className="mt-10 grid auto-rows-fr grid-cols-1 gap-4 min-[720px]:grid-cols-2 lg:grid-cols-3">
                {isLoading &&
                    [0, 1, 2].map(i => (
                        <Reveal key={i} delay={i * 90} className="h-full">
                            <PlanSkeleton />
                        </Reveal>
                    ))}

                {!isLoading && plansUnavailable && (
                    <PlansUnavailable
                        isFetching={isFetching}
                        onRetry={() => void refetch()}
                    />
                )}

                {!isLoading &&
                    !plansUnavailable &&
                    cards.map(({ period, view, redirectId }, i) => {
                        const meta = PLANS_META[period];
                        const ribbonLabel = meta.accent
                            ? t('plans.popular')
                            : meta.ribbon
                              ? t('plans.bestValue')
                              : undefined;

                        return (
                            <Reveal
                                key={redirectId || i}
                                delay={i * 90}
                                className="h-full"
                            >
                                <PricingCard
                                    plan={view}
                                    accent={meta.accent}
                                    ribbonLabel={ribbonLabel}
                                    ctaLabel={`${t('plans.choose')} ${view.name}`}
                                    onSelect={() => selectPlan(redirectId)}
                                />
                            </Reveal>
                        );
                    })}
            </div>
            {!isLoading && !plansUnavailable && <PlansTrustBar />}
        </MarketingSection>
    );
}
