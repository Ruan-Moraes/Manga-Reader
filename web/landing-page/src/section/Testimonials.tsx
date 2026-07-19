import { useTranslation } from 'react-i18next';
import { RatingStars } from '@/shared/component/Icon';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import Reveal from '@/shared/component/Reveal';
import { TESTIMONIALS_META, type TestimonialText } from '@/shared/data/landing';

export default function Testimonials() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const items = t('testimonials.items', {
        returnObjects: true,
    }) as TestimonialText[];
    return (
        <MarketingSection key={locale} id="testimonials">
            <SectionHeading
                eyebrow={t('testimonials.eyebrow')}
                title={t('testimonials.title')}
            />
            <div className="mt-10 grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 min-[560px]:gap-[18px] lg:grid-cols-4">
                {items.map((item, index) => {
                    const meta = TESTIMONIALS_META[index];
                    return (
                        <Reveal key={item.name} delay={index * 60}>
                            <article className="flex h-full flex-col rounded-[14px] border border-border bg-card p-[22px]">
                                <RatingStars value={meta.rating} size={15} />
                                <blockquote className="m-[14px_0_20px] flex-1 text-[0.875rem] italic leading-[1.7] text-copy">
                                    “{item.text}”
                                </blockquote>
                                <footer className="flex items-center gap-3">
                                    <span
                                        className="inline-flex size-[42px] shrink-0 items-center justify-center rounded-[9px] text-[0.875rem] font-black text-on-accent"
                                        style={{ backgroundColor: meta.color }}
                                    >
                                        {meta.initials}
                                    </span>
                                    <div className="grid gap-[3px]">
                                        <strong className="text-[0.875rem] text-fg">
                                            {item.name}
                                        </strong>
                                        <span className="text-xs text-tertiary">
                                            {item.role}
                                        </span>
                                    </div>
                                </footer>
                            </article>
                        </Reveal>
                    );
                })}
            </div>
        </MarketingSection>
    );
}
