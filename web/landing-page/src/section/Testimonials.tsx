import { useTranslation } from 'react-i18next';

import { RatingStars } from '@/shared/component/Icon';
import { Section, SectionTitle } from '@/shared/component/Primitives';
import Reveal from '@/shared/component/Reveal';

import { TESTIMONIALS_META, type TestimonialText } from '@/shared/data/landing';

export default function Testimonials() {
    const { t } = useTranslation();

    const items = t('testimonials.items', { returnObjects: true }) as TestimonialText[];

    return (
        <Section id="testimonials">
            <SectionTitle eyebrow={t('testimonials.eyebrow')} title={t('testimonials.title')} />
            <div
                className="lp-test-grid"
                style={{
                    marginTop: 48,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                    gap: 18,
                }}
            >
                {items.map((it, i) => {
                    const meta = TESTIMONIALS_META[i];

                    return (
                        <Reveal key={i} delay={(i % 4) * 70}>
                            <div
                                style={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 22,
                                    borderRadius: 8,
                                    background: 'var(--color-secondary)',
                                    border: '1px solid #444',
                                }}
                            >
                                <RatingStars value={meta.rating} size={15} />
                                <p style={{ margin: '14px 0 18px', flex: 1, fontSize: 14, color: '#fff', lineHeight: 1.6, fontStyle: 'italic' }}>
                                    “{it.text}”
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            background: meta.color,
                                            color: '#161616',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: 14,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {meta.initials}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '.0625rem' }}>{it.name}</div>
                                        <div style={{ fontSize: 12, color: '#727273' }}>{it.role}</div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    );
                })}
            </div>
        </Section>
    );
}
