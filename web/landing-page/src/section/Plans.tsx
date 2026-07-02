import { useTranslation } from 'react-i18next';

import type { SubscriptionPeriod } from '@manga-reader/types';

import Icon from '@/shared/component/Icon';
import PricingCard from '@/shared/component/PricingCard';
import { Section, SectionTitle } from '@/shared/component/Primitives';
import Reveal from '@/shared/component/Reveal';

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
        <div style={{ height: '100%', padding: '28px 24px', borderRadius: 12, background: 'var(--color-secondary)', border: '1px solid #444' }}>
            <div className="lp-skeleton" style={{ height: 14, width: '40%', borderRadius: 4 }} />
            <div className="lp-skeleton" style={{ height: 38, width: '60%', borderRadius: 6, margin: '16px 0 24px' }} />
            {[0, 1, 2, 3].map(i => (
                <div key={i} className="lp-skeleton" style={{ height: 13, width: `${85 - i * 8}%`, borderRadius: 4, margin: '12px 0' }} />
            ))}
            <div className="lp-skeleton" style={{ height: 48, width: '100%', borderRadius: 4, marginTop: 18 }} />
        </div>
    );
}

export default function Plans() {
    const { t, i18n } = useTranslation();

    const { data: apiPlans = [], isLoading } = usePlans();

    const staticItems = t('plans.items', { returnObjects: true }) as PlanView[];
    const trust = t('plans.trust', { returnObjects: true }) as string[];

    function formatPrice(cents: number): string {
        return (cents / 100).toLocaleString(i18n.language, { style: 'currency', currency: 'BRL' });
    }

    // API com fallback estático: prefere planos da API; senão usa o conteúdo do i18n.
    const useApi = apiPlans.length > 0;

    const sortedApi = [...apiPlans].sort(
        (a, b) => PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period),
    );

    const cards: { view: PlanView; redirectId: string }[] = useApi
        ? sortedApi.map((plan, i) => ({
              view: {
                  name: staticItems[i]?.name ?? t(`plans.period.${plan.period.toLowerCase()}`),
                  price: formatPrice(plan.priceInCents),
                  period: t(PERIOD_SUFFIX_KEY[plan.period]),
                  features: plan.features.map(f => f.label),
                  equiv: staticItems[i]?.equiv,
                  save: staticItems[i]?.save,
              },
              redirectId: plan.id,
          }))
        : staticItems.map((view, i) => ({ view, redirectId: PLANS_META[i]?.id ?? '' }));

    function handleSelect(redirectId: string) {
        const appUrl = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173';

        window.location.href = `${appUrl}/subscription?plan=${redirectId}`;
    }

    return (
        <Section id="plans" alt>
            <SectionTitle eyebrow={t('plans.eyebrow')} title={t('plans.title')} sub={t('plans.sub')} />
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                    gap: 20,
                    alignItems: 'stretch',
                    maxWidth: 1040,
                    margin: '48px auto 0',
                }}
            >
                {isLoading
                    ? [0, 1, 2].map(i => (
                          <Reveal key={i} delay={i * 90}>
                              <PlanSkeleton />
                          </Reveal>
                      ))
                    : cards.map(({ view, redirectId }, i) => {
                          const meta = PLANS_META[i] ?? { accent: false };
                          const ribbonLabel = meta.accent
                              ? t('plans.popular')
                              : meta.ribbon
                                ? t('plans.bestValue')
                                : undefined;

                          return (
                              <Reveal key={redirectId || i} delay={i * 90}>
                                  <PricingCard
                                      plan={view}
                                      accent={meta.accent}
                                      ribbonLabel={ribbonLabel}
                                      equivLabel={t('plans.monthlyEquiv')}
                                      saveLabel={t('plans.save')}
                                      ctaLabel={`${t('plans.choose')} ${view.name}`}
                                      onSelect={() => handleSelect(redirectId)}
                                  />
                              </Reveal>
                          );
                      })}
            </div>
            <Reveal delay={120} style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px 24px', marginTop: 32 }}>
                {trust.map((tr, i) => (
                    <span
                        key={i}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#999', fontSize: 13, fontWeight: 600, letterSpacing: '.0625rem' }}
                    >
                        <Icon name="shield" size={16} style={{ color: '#ddda2a' }} />
                        {tr}
                    </span>
                ))}
            </Reveal>
        </Section>
    );
}
