import { useTranslation } from 'react-i18next';

import Button from '@/shared/component/Button';
import Icon from '@/shared/component/Icon';
import { appHref } from '@/shared/config/appLinks';
import type { GiftStep } from '@/shared/data/landing';

export function GiftGivePanel() {
    const { t } = useTranslation();
    const steps = t('gift.steps', { returnObjects: true }) as GiftStep[];

    return (
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
                    href={appHref('/subscription', { action: 'gift' })}
                    size="lg"
                    icon={<Icon name="gift" size={17} />}
                >
                    {t('gift.giveCta')}
                </Button>
            </div>
        </div>
    );
}
