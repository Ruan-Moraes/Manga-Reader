import { useTranslation } from 'react-i18next';

import Accordion from '@/shared/component/Accordion';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import Reveal from '@/shared/component/Reveal';
import type { FaqText } from '@/shared/data/landing';

export default function FAQ() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const items = t('faq.items', { returnObjects: true }) as FaqText[];

    return (
        <MarketingSection key={locale} id="faq" tone="raised">
            <SectionHeading eyebrow={t('faq.eyebrow')} title={t('faq.title')} />
            <Reveal delay={80} className="mx-auto mt-[38px] max-w-[840px]">
                <Accordion
                    defaultOpen={0}
                    items={items.map(item => ({
                        question: item.q,
                        answer: item.a,
                    }))}
                />
            </Reveal>
        </MarketingSection>
    );
}
