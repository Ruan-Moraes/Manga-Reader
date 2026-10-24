import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from '@ui/SectionHeader';
import { AccordionItem } from '@ui/Accordion';
import { FAQ_KEYS } from './helpData';

const HelpFaqSection = () => {
    const { t } = useTranslation('help');
    const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean | null>>({});

    return (
        <section className="mb-12">
            <SectionHeader eyebrow={t('faq.eyebrow')} title={t('faq.title')} className="mb-6" />
            <div className="flex flex-col gap-2">
                {FAQ_KEYS.map(key => (
                    <AccordionItem key={key} title={t(`faqItems.${key}.q`)}>
                        <p className="text-ui-body text-ui-fg-muted leading-relaxed">{t(`faqItems.${key}.a`)}</p>
                        <div className="mt-3 flex items-center gap-3 text-ui-tiny text-ui-fg-subtle">
                            <span>{t('faq.helpful')}</span>
                            <button
                                type="button"
                                aria-label={t('faq.yesAria')}
                                onClick={() => setHelpfulVotes(v => ({ ...v, [key]: true }))}
                                className={`inline-flex items-center gap-1 hover:text-ui-accent-fg ${helpfulVotes[key] === true ? 'text-ui-accent-fg' : ''}`}
                            >
                                <ThumbsUp className="size-3.5" /> {t('faq.yes')}
                            </button>
                            <button
                                type="button"
                                aria-label={t('faq.noAria')}
                                onClick={() =>
                                    setHelpfulVotes(v => ({
                                        ...v,
                                        [key]: false,
                                    }))
                                }
                                className={`inline-flex items-center gap-1 hover:text-ui-danger ${helpfulVotes[key] === false ? 'text-ui-danger' : ''}`}
                            >
                                <ThumbsDown className="size-3.5" /> {t('faq.no')}
                            </button>
                        </div>
                    </AccordionItem>
                ))}
            </div>
        </section>
    );
};

export default HelpFaqSection;
