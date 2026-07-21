import { useTranslation } from 'react-i18next';

import type { SubscriptionPeriod } from '@manga-reader/types';

import Button from '@/shared/component/Button';
import Icon from '@/shared/component/Icon';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import PricingCard from '@/shared/component/PricingCard';
import Reveal from '@/shared/component/Reveal';
import { appHref } from '@/shared/config/appLinks';

import { usePlans } from '@/feature/plans/hook/usePlans';
import { PLANS_META, type PlanView } from '@/shared/data/landing';

const PERIOD_ORDER: SubscriptionPeriod[] = ['DAILY', 'MONTHLY', 'ANNUAL'];

const PERIOD_SUFFIX_KEY: Record<SubscriptionPeriod, string> = {
    DAILY: 'plans.perDay',
    MONTHLY: 'plans.perMonth',
    ANNUAL: 'plans.perYear',
};

function PlanSkeleton() {
    return (
        <div
            data-testid="plan-skeleton"
            className="h-full rounded-[14px] border border-border bg-card px-6 py-7 [&>div]:my-3 [&>div]:h-[13px] [&>div]:animate-shimmer [&>div]:rounded [&>div]:bg-[linear-gradient(90deg,var(--color-surface-muted),var(--color-surface-elevated),var(--color-surface-muted))] [&>div]:bg-[length:200%_100%] [&>div:first-child]:mt-0 [&>div:first-child]:h-3.5 [&>div:first-child]:w-2/5 [&>div:nth-child(2)]:my-[16px] [&>div:nth-child(2)]:mb-6 [&>div:nth-child(2)]:h-[38px] [&>div:nth-child(2)]:w-3/5 [&>div:nth-child(3)]:w-[85%] [&>div:nth-child(4)]:w-[77%] [&>div:nth-child(5)]:w-[69%] [&>div:nth-child(6)]:w-[61%] [&>div:last-child]:mt-[18px] [&>div:last-child]:h-12 [&>div:last-child]:w-full"
        >
            <div />
            <div />
            {[0, 1, 2, 3].map(i => (
                <div key={i} />
            ))}
            <div />
        </div>
    );
}

export default function Plans() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;

    const {
        data: apiPlans = [],
        isError,
        isFetching,
        isLoading,
        refetch,
    } = usePlans(locale);

    const trust = t('plans.trust', { returnObjects: true }) as string[];

    function formatPrice(cents: number): string {
        return (cents / 100).toLocaleString(i18n.language, {
            style: 'currency',
            currency: 'BRL',
        });
    }

    const sortedApi = apiPlans.filter(plan => plan.active).sort(
        (a, b) =>
            PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period),
    );

    const cards: {
        period: SubscriptionPeriod;
        view: PlanView;
        redirectId: string;
    }[] = sortedApi.map(plan => ({
        period: plan.period,
        view: {
            name: t(`plans.periodName.${plan.period.toLowerCase()}`),
            price: formatPrice(plan.priceInCents),
            period: t(PERIOD_SUFFIX_KEY[plan.period]),
            description: plan.description,
            features: plan.features,
        },
        redirectId: plan.id,
    }));

    const plansUnavailable = isError || (!isLoading && cards.length === 0);

    function handleSelect(redirectId: string) {
        window.location.href = `${appHref('/subscription')}?plan=${encodeURIComponent(redirectId)}`;
    }

    return (
        <MarketingSection key={locale} id="plans" tone="raised">
            <SectionHeading
                eyebrow={t('plans.eyebrow')}
                title={t('plans.title')}
                description={t('plans.sub')}
            />
            <div className="mt-10 grid auto-rows-fr grid-cols-1 gap-4 min-[720px]:grid-cols-2 lg:grid-cols-3">
                {isLoading
                    ? [0, 1, 2].map(i => (
                          <Reveal key={i} delay={i * 90} className="h-full">
                              <PlanSkeleton />
                          </Reveal>
                      ))
                    : plansUnavailable
                      ? (
                            <Reveal className="min-[720px]:col-span-2 lg:col-span-3">
                                <div
                                    role="status"
                                    aria-live="polite"
                                    aria-busy={isFetching}
                                    className="mx-auto flex max-w-[680px] flex-col items-center rounded-[14px] border border-accent-muted bg-[linear-gradient(180deg,var(--color-accent-5),var(--color-card))] px-6 py-10 text-center shadow-[var(--shadow-floating)] sm:px-10"
                                >
                                    <span className="mb-5 grid size-12 place-items-center rounded-full border border-accent-muted bg-accent-subtle text-accent-fg">
                                        <Icon name="sync" size={22} />
                                    </span>
                                    <h3 className="m-0 text-xl font-extrabold text-fg sm:text-2xl">
                                        {t('plans.unavailableTitle')}
                                    </h3>
                                    <p className="mt-3 max-w-[560px] text-sm leading-6 text-copy sm:text-base sm:leading-7">
                                        {t('plans.unavailableDescription')}
                                    </p>
                                    <Button
                                        className="mt-6"
                                        variant="outline"
                                        icon={<Icon name="sync" size={17} />}
                                        disabled={isFetching}
                                        onClick={() => void refetch()}
                                    >
                                        {t('plans.retry')}
                                    </Button>
                                </div>
                            </Reveal>
                        )
                      : cards.map(({ period, view, redirectId }, i) => {
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
                                      onSelect={() => handleSelect(redirectId)}
                                  />
                              </Reveal>
                          );
                      })}
            </div>
            {!isLoading && !plansUnavailable ? (
                <Reveal
                    delay={120}
                    className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-2 [&>span]:text-[0.8125rem] [&>span]:font-bold [&>span]:text-copy-muted [&>span>svg]:text-accent-fg"
                >
                    {trust.map((tr, i) => (
                        <span key={i}>
                            <Icon name="shield" size={16} />
                            {tr}
                        </span>
                    ))}
                </Reveal>
            ) : null}
        </MarketingSection>
    );
}
