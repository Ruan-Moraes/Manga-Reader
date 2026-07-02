import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Icon, { type IconName } from '@/shared/component/Icon';
import { Section, SectionTitle } from '@/shared/component/Primitives';
import Reveal from '@/shared/component/Reveal';

import { BENEFITS_META, type BenefitText } from '@/shared/data/landing';

function BenefitCard({ icon, title, desc }: { icon: IconName; title: string; desc: string }) {
    const [hover, setHover] = useState(false);

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                height: '100%',
                padding: 22,
                borderRadius: 8,
                background: 'var(--color-secondary)',
                border: `1px solid ${hover ? 'rgba(221,218,42,0.55)' : '#444'}`,
                boxShadow: hover ? '-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)' : 'none',
                transform: hover ? 'translateY(-3px)' : 'none',
                transition: 'all .3s ease',
            }}
        >
            <div
                style={{
                    width: 46,
                    height: 46,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(221,218,42,0.10)',
                    border: '1px solid rgba(221,218,42,0.3)',
                    color: '#ddda2a',
                    marginBottom: 16,
                }}
            >
                <Icon name={icon} size={22} stroke={2} />
            </div>
            <h3 style={{ margin: '0 0 7px', fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '.0625rem' }}>
                {title}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#999', lineHeight: 1.55 }}>{desc}</p>
        </div>
    );
}

export default function Benefits() {
    const { t } = useTranslation();

    const items = t('benefits.items', { returnObjects: true }) as BenefitText[];

    return (
        <Section id="benefits">
            <SectionTitle eyebrow={t('benefits.eyebrow')} title={t('benefits.title')} />
            <div
                style={{
                    marginTop: 48,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
                    gap: 16,
                }}
            >
                {items.map((it, i) => (
                    <Reveal key={i} delay={(i % 3) * 70}>
                        <BenefitCard icon={BENEFITS_META[i]} title={it.t} desc={it.d} />
                    </Reveal>
                ))}
            </div>
        </Section>
    );
}
