import { useState, type CSSProperties, type ReactNode } from 'react';

import Icon, { AppleGlyph, PlayGlyph, type IconName } from '@/shared/component/Icon';

/* ---------------- Logo wordmark ---------------- */
export function Wordmark({ size = 20 }: { size?: number }) {
    const iconSize = size + 7;

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <img
                src={`${import.meta.env.BASE_URL}favicon-64x64.png`}
                alt=""
                width={iconSize}
                height={iconSize}
                style={{
                    display: 'block',
                    flexShrink: 0,
                    width: iconSize,
                    height: iconSize,
                    borderRadius: 3,
                    objectFit: 'contain',
                }}
            />
            <span
                style={{
                    fontStyle: 'italic',
                    fontWeight: 800,
                    fontSize: size,
                    letterSpacing: '1.5px',
                    color: '#fff',
                }}
            >
                Manga <span style={{ color: '#ddda2a' }}>Reader</span>
            </span>
        </span>
    );
}

/* ---------------- Eyebrow (label de seção) ---------------- */
export function Eyebrow({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: '#ddda2a',
            }}
        >
            <span style={{ width: 22, height: 1, background: '#ddda2a', opacity: 0.6 }} />
            {children}
        </div>
    );
}

/* ---------------- Título de seção ---------------- */
interface SectionTitleProps {
    eyebrow?: string;
    title: string;
    sub?: string;
    center?: boolean;
}

export function SectionTitle({ eyebrow, title, sub, center = true }: SectionTitleProps) {
    return (
        <div
            style={{
                textAlign: center ? 'center' : 'left',
                maxWidth: center ? 720 : 'none',
                margin: center ? '0 auto' : 0,
            }}
        >
            {eyebrow && (
                <div style={{ display: 'flex', justifyContent: center ? 'center' : 'flex-start' }}>
                    <Eyebrow>{eyebrow}</Eyebrow>
                </div>
            )}
            <h2
                style={{
                    margin: 0,
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '.0625rem',
                    fontSize: 'clamp(26px, 5vw, 40px)',
                    lineHeight: 1.12,
                    textWrap: 'balance',
                }}
            >
                {title}
            </h2>
            {sub && (
                <p
                    style={{
                        margin: '14px auto 0',
                        maxWidth: 600,
                        color: '#999',
                        fontSize: 'clamp(14px,2.4vw,16px)',
                        lineHeight: 1.6,
                    }}
                >
                    {sub}
                </p>
            )}
        </div>
    );
}

/* ---------------- Wrapper de seção (padding + max-width) ---------------- */
interface SectionProps {
    id?: string;
    children: ReactNode;
    alt?: boolean;
    style?: CSSProperties;
}

export function Section({ id, children, alt = false, style }: SectionProps) {
    return (
        <section
            id={id}
            style={{
                padding: 'clamp(56px, 9vw, 104px) 20px',
                background: alt
                    ? 'linear-gradient(180deg, var(--color-primary) 0%, var(--color-secondary) 9%, var(--color-secondary) 91%, var(--color-primary) 100%)'
                    : 'transparent',
                position: 'relative',
                ...style,
            }}
        >
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>{children}</div>
        </section>
    );
}

/* ---------------- Badge de plataforma (pill) ---------------- */
interface PlatformBadgeProps {
    icon: IconName;
    label: string;
    accent?: boolean;
}

export function PlatformBadge({ icon, label, accent = false }: PlatformBadgeProps) {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.0625rem',
                background: accent ? 'rgba(221,218,42,0.12)' : 'rgba(255,255,255,0.04)',
                color: accent ? '#ddda2a' : '#cccccc',
                border: `1px solid ${accent ? 'rgba(221,218,42,0.45)' : '#444'}`,
                whiteSpace: 'nowrap',
            }}
        >
            <Icon name={icon} size={15} stroke={2.2} />
            {label}
        </span>
    );
}

/* ---------------- Botão de loja (App Store / Google Play) ---------------- */
interface StoreButtonProps {
    kind: 'apple' | 'play';
    line1: string;
    line2: string;
}

export function StoreButton({ kind, line1, line2 }: StoreButtonProps) {
    const [hover, setHover] = useState(false);

    return (
        <a
            href="#"
            onClick={e => e.preventDefault()}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 11,
                minHeight: 54,
                padding: '0 18px',
                background: '#161616',
                color: '#fff',
                textDecoration: 'none',
                border: `1px solid ${hover ? '#ddda2a' : '#444'}`,
                borderRadius: 8,
                boxShadow: hover ? 'none' : '-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)',
                transition: 'all .3s ease',
            }}
        >
            {kind === 'apple' ? <AppleGlyph size={24} /> : <PlayGlyph size={24} />}
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#999', letterSpacing: '.06em' }}>
                    {line1}
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '.0625rem' }}>
                    {line2}
                </span>
            </span>
        </a>
    );
}
