import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Section, SectionTitle } from '@/shared/component/Primitives';
import Reveal from '@/shared/component/Reveal';

import type { FaqText } from '@/shared/data/landing';

function FaqItem({ q, a, open, onToggle, id }: { q: string; a: string; open: boolean; onToggle: () => void; id: number }) {
    const ref = useRef<HTMLParagraphElement>(null);

    return (
        <div style={{ borderBottom: '1px solid #2d2d2d' }}>
            <button
                id={`faq-h-${id}`}
                aria-expanded={open}
                aria-controls={`faq-p-${id}`}
                onClick={onToggle}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    textAlign: 'left',
                    padding: '20px 4px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    color: open ? '#ddda2a' : '#fff',
                    fontSize: 'clamp(15px,2.4vw,17px)',
                    fontWeight: 700,
                    letterSpacing: '.0625rem',
                    transition: 'color .3s',
                }}
            >
                {q}
                <span
                    style={{
                        flexShrink: 0,
                        color: '#ddda2a',
                        transform: open ? 'rotate(45deg)' : 'none',
                        transition: 'transform .3s ease',
                        lineHeight: 0,
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </span>
            </button>
            <div
                id={`faq-p-${id}`}
                role="region"
                aria-labelledby={`faq-h-${id}`}
                style={{
                    maxHeight: open ? (ref.current ? ref.current.scrollHeight + 24 : 400) : 0,
                    overflow: 'hidden',
                    transition: 'max-height .35s ease',
                }}
            >
                <p ref={ref} style={{ margin: 0, padding: '0 4px 22px', maxWidth: 760, fontSize: 15, color: '#999', lineHeight: 1.65 }}>
                    {a}
                </p>
            </div>
        </div>
    );
}

export default function FAQ() {
    const { t } = useTranslation();

    const items = t('faq.items', { returnObjects: true }) as FaqText[];

    const [open, setOpen] = useState(0);

    return (
        <Section id="faq" alt>
            <SectionTitle eyebrow={t('faq.eyebrow')} title={t('faq.title')} />
            <Reveal delay={80} style={{ maxWidth: 820, margin: '40px auto 0' }}>
                <div style={{ borderTop: '1px solid #2d2d2d' }}>
                    {items.map((it, i) => (
                        <FaqItem key={i} id={i} q={it.q} a={it.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
                    ))}
                </div>
            </Reveal>
        </Section>
    );
}
