import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Accordion from '@/shared/component/Accordion';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import Reveal from '@/shared/component/Reveal';
import type { FaqText } from '@/shared/data/landing';

export default function FAQ() {
    const { t } = useTranslation();
    const items = useMemo(
        () => t('faq.items', { returnObjects: true }) as FaqText[],
        [t],
    );

    const accordionItems = useMemo(
        () =>
            items.map(item => ({
                question: item.q,
                answer: item.a,
            })),
        [items],
    );

    return (
        <MarketingSection id="faq" tone="raised">
            <SectionHeading eyebrow={t('faq.eyebrow')} title={t('faq.title')} />
            <Reveal delay={80} className="mx-auto mt-[38px] max-w-[840px]">
                <Accordion defaultOpen={0} items={accordionItems} />
            </Reveal>
        </MarketingSection>
    );
}
