import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/shared/component/Button';
import Icon from '@/shared/component/Icon';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import Reveal from '@/shared/component/Reveal';
import SegmentedTabs from '@/shared/component/SegmentedTabs';
import { appHref } from '@/shared/config/appLinks';
import type { GiftStep } from '@/shared/data/landing';

type Tab = 'give' | 'redeem';

export default function Gift() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const [tab, setTab] = useState<Tab>('give');
    const [code, setCode] = useState('');
    const steps = t('gift.steps', { returnObjects: true }) as GiftStep[];

    function handleRedeem() {
        const trimmed = code.trim();
        window.location.href = trimmed
            ? `${appHref('/subscription/redeem')}?code=${encodeURIComponent(trimmed)}`
            : appHref('/subscription/redeem');
    }

    return (
        <MarketingSection key={locale} id="gift" tone="raised">
            <SectionHeading
                eyebrow={t('gift.eyebrow')}
                title={t('gift.title')}
                description={t('gift.sub')}
            />
            <Reveal delay={80} className="mt-[34px] flex justify-center">
                <SegmentedTabs
                    ariaLabel={t('gift.tablistLabel')}
                    tabs={[
                        {
                            id: 'give',
                            label: t('gift.tabGive'),
                            icon: <Icon name="gift" size={16} />,
                        },
                        {
                            id: 'redeem',
                            label: t('gift.tabRedeem'),
                            icon: <Icon name="ticket" size={16} />,
                        },
                    ]}
                    value={tab}
                    onValueChange={setTab}
                    panelId="gift"
                />
            </Reveal>
            <Reveal delay={130} className="mx-auto mt-[34px] max-w-[920px]">
                <div
                    id="gift-panel"
                    role="tabpanel"
                    aria-labelledby={`gift-tab-${tab}`}
                    tabIndex={0}
                >
                    {tab === 'give' ? (
                        <div className="animate-fade">
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-4">
                                {steps.map((step, index) => (
                                    <article
                                        className="rounded-[14px] border border-border bg-card p-[22px] text-left"
                                        key={step.t}
                                    >
                                        <span className="inline-flex size-[38px] items-center justify-center rounded-full bg-accent font-black text-on-accent">
                                            {index + 1}
                                        </span>
                                        <h3 className="m-[14px_0_6px] text-base text-fg">
                                            {step.t}
                                        </h3>
                                        <p className="m-0 text-[0.875rem] leading-[1.6] text-copy-muted">
                                            {step.d}
                                        </p>
                                    </article>
                                ))}
                            </div>
                            <div className="mt-7 flex justify-center">
                                <Button
                                    href={`${appHref('/subscription')}?action=gift`}
                                    size="lg"
                                    icon={<Icon name="gift" size={17} />}
                                >
                                    {t('gift.giveCta')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto max-w-[460px] animate-fade rounded-[14px] border border-border bg-card p-7 text-center">
                            <span className="mb-4 inline-flex size-[52px] items-center justify-center rounded-full border border-accent-muted bg-accent-subtle text-accent-fg">
                                <Icon name="ticket" size={24} />
                            </span>
                            <label
                                className="mb-2.5 block text-[0.875rem] font-extrabold text-copy"
                                htmlFor="gift-code"
                            >
                                {t('gift.redeemLabel')}
                            </label>
                            <input
                                id="gift-code"
                                type="text"
                                className="mb-3.5 h-[50px] w-full rounded-[10px] border border-line bg-primary px-3.5 text-center font-extrabold tracking-[0.12em] text-fg uppercase outline-none transition-[border-color,box-shadow] duration-[180ms] placeholder:text-tertiary focus:border-accent-border focus:shadow-[0_0_0_3px_rgb(221_218_42_/_10%)]"
                                value={code}
                                onChange={event => setCode(event.target.value)}
                                placeholder={t('gift.redeemPlaceholder')}
                            />
                            <Button
                                size="lg"
                                className="w-full"
                                onClick={handleRedeem}
                            >
                                {t('gift.redeemCta')}
                            </Button>
                            <p className="mt-3.5 text-[0.875rem] leading-[1.6] text-copy-muted">
                                {t('gift.redeemHint')}
                            </p>
                        </div>
                    )}
                </div>
            </Reveal>
        </MarketingSection>
    );
}
