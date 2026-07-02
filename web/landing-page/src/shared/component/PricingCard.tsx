import { useState, type CSSProperties } from 'react';

import Icon from '@/shared/component/Icon';

import type { PlanView } from '@/shared/data/landing';

interface PricingCardProps {
    plan: PlanView;
    accent?: boolean;
    /** Texto da faixa (ex.: "Mais popular" / "Melhor valor"); ausente = sem faixa. */
    ribbonLabel?: string;
    equivLabel: string;
    saveLabel: string;
    ctaLabel: string;
    onSelect?: () => void;
}

function accentButton(): CSSProperties {
    return {
        height: 48,
        borderRadius: 2,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        width: '100%',
        background: '#ddda2a',
        color: '#161616',
        fontWeight: 800,
        fontSize: 15,
        letterSpacing: '.0625rem',
    };
}

function ghostButton(hover: boolean): CSSProperties {
    return {
        height: 48,
        borderRadius: 2,
        cursor: 'pointer',
        fontFamily: 'inherit',
        width: '100%',
        background: hover ? 'rgba(221,218,42,0.12)' : 'transparent',
        color: '#fff',
        border: '1px solid #727273',
        fontWeight: 700,
        fontSize: 15,
        letterSpacing: '.0625rem',
        transition: 'all .3s ease',
    };
}

export default function PricingCard({
    plan,
    accent = false,
    ribbonLabel,
    equivLabel,
    saveLabel,
    ctaLabel,
    onSelect,
}: PricingCardProps) {
    const [hover, setHover] = useState(false);

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '28px 24px',
                borderRadius: 12,
                background: accent
                    ? 'linear-gradient(180deg, rgba(221,218,42,0.07), var(--color-secondary) 55%)'
                    : 'var(--color-secondary)',
                border: `1px solid ${accent ? 'rgba(221,218,42,0.6)' : hover ? 'rgba(221,218,42,0.4)' : '#444'}`,
                boxShadow: accent
                    ? '-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)'
                    : hover
                      ? '-0.25rem 0.25rem 0 0 rgba(221,218,42,0.2)'
                      : 'none',
                transform: hover && !accent ? 'translateY(-3px)' : 'none',
                transition: 'all .3s ease',
            }}
        >
            {ribbonLabel && (
                <span
                    style={{
                        position: 'absolute',
                        top: -11,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '.1em',
                        textTransform: 'uppercase',
                        padding: '4px 12px',
                        borderRadius: 999,
                        background: '#ddda2a',
                        color: '#161616',
                    }}
                >
                    {ribbonLabel}
                </span>
            )}

            <div style={{ fontSize: 13, fontWeight: 800, color: '#ddda2a', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                {plan.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '12px 0 4px' }}>
                <span style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: '.0625rem', lineHeight: 1 }}>
                    {plan.price}
                </span>
                <span style={{ fontSize: 15, color: '#999', fontWeight: 600 }}>{plan.period}</span>
            </div>
            {plan.equiv ? (
                <div style={{ fontSize: 12, color: '#727273', minHeight: 18 }}>
                    {equivLabel} <strong style={{ color: '#cccccc' }}>{plan.equiv}</strong> · {saveLabel} {plan.save}
                </div>
            ) : (
                <div style={{ minHeight: 18 }} />
            )}

            <ul
                style={{
                    listStyle: 'none',
                    margin: '22px 0',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 11,
                    flex: 1,
                }}
            >
                {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#fff', fontSize: 14 }}>
                        <Icon name="check" size={16} stroke={3} style={{ color: '#ddda2a', flexShrink: 0, marginTop: 2 }} />
                        {f}
                    </li>
                ))}
            </ul>

            <button onClick={onSelect} style={accent ? accentButton() : ghostButton(hover)}>
                {ctaLabel}
            </button>
        </div>
    );
}

export { accentButton, ghostButton };
