import { useEffect, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { BrowserFrame, PhoneFrame } from '@/shared/component/DeviceFrames';
import Icon, { type IconName } from '@/shared/component/Icon';
import { LibraryScreen, ReaderScreen } from '@/shared/component/MockScreens';
import { PlatformBadge } from '@/shared/component/Primitives';
import Reveal from '@/shared/component/Reveal';

import { goToSection } from '@/shared/util/smoothScroll';

function FloatChip({
    icon,
    label,
    style,
    accent,
    className,
}: {
    icon: IconName;
    label: string;
    style?: CSSProperties;
    accent?: boolean;
    className?: string;
}) {
    return (
        <div
            className={className}
            style={{
                position: 'absolute',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 14px',
                borderRadius: 999,
                background: 'rgba(22,22,22,0.85)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: `1px solid ${accent ? 'rgba(221,218,42,0.5)' : '#444'}`,
                color: accent ? '#ddda2a' : '#fff',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '.0625rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                ...style,
            }}
        >
            <Icon name={icon} size={15} stroke={2.2} />
            {label}
        </div>
    );
}

export default function Hero() {
    const { t } = useTranslation();

    const badges = t('hero.badges', { returnObjects: true }) as string[];

    const [py, setPy] = useState(0);

    useEffect(() => {
        const reduce =
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduce) return;

        let raf = 0;

        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setPy(window.scrollY));
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(raf);
        };
    }, []);

    const platBadges: { icon: IconName; label: string; accent?: boolean }[] = [
        { icon: 'smartphone', label: badges[0], accent: true },
        { icon: 'smartphone', label: badges[1] },
        { icon: 'globe', label: badges[2] },
        { icon: 'wifiOff', label: badges[3], accent: true },
        { icon: 'noAds', label: badges[4] },
    ];

    return (
        <section
            id="top"
            style={{
                height: '100vh',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'min(1100px, 120vw)',
                    height: 680,
                    background:
                        'radial-gradient(ellipse at center, rgba(221,218,42,0.10), transparent 32%)',
                    pointerEvents: 'none',
                }}
            />
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background:
                        'radial-gradient(circle at 80% 18%, rgba(221,218,42,0.06), transparent 45%)',
                }}
            />

            <div
                className="lp-hero-grid"
                style={{
                    margin: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '8rem',
                    height: '100%',
                }}
            >
                {/* coluna texto */}
                <div style={{ textAlign: 'center' }}>
                    <Reveal
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 14px',
                                borderRadius: 999,
                                background: 'rgba(221,218,42,0.10)',
                                border: '1px solid rgba(221,218,42,0.35)',
                                color: '#ddda2a',
                                fontSize: 11,
                                fontWeight: 800,
                                letterSpacing: '.14em',
                                textTransform: 'uppercase',
                            }}
                        >
                            <Icon name="zap" size={13} />
                            {t('hero.eyebrow')}
                        </span>
                    </Reveal>

                    <Reveal
                        delay={80}
                        as="h1"
                        style={{
                            margin: '22px 0 0',
                            fontWeight: 800,
                            color: '#fff',
                            letterSpacing: '.0625rem',
                            fontSize: 'clamp(36px, 7.5vw, 72px)',
                            lineHeight: 1.04,
                            textWrap: 'balance',
                        }}
                    >
                        {t('hero.title1')}{' '}
                        <span style={{ color: '#ddda2a' }}>
                            {t('hero.title2')}
                        </span>
                        <span
                            style={{
                                display: 'block',
                                fontSize: '0.42em',
                                fontWeight: 700,
                                color: '#cccccc',
                                marginTop: 14,
                                letterSpacing: '.0625rem',
                            }}
                        >
                            {t('hero.titleTail')}
                        </span>
                    </Reveal>

                    <Reveal
                        delay={150}
                        as="p"
                        style={{
                            margin: '20px auto 0',
                            maxWidth: 560,
                            color: '#999',
                            fontSize: 'clamp(15px,2.6vw,18px)',
                            lineHeight: 1.6,
                        }}
                    >
                        {t('hero.sub')}
                    </Reveal>

                    <Reveal
                        delay={220}
                        style={{
                            display: 'flex',
                            gap: 14,
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            marginTop: 32,
                        }}
                    >
                        {/* TODO: Fazer animacao de hover desse botao */}
                        <button
                            onClick={() => goToSection('plans')}
                            className="lp-cta-pulse"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 9,
                                height: 54,
                                padding: '0 28px',
                                borderRadius: 2,
                                background: '#ddda2a',
                                color: '#161616',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontWeight: 800,
                                fontSize: 16,
                                letterSpacing: '.0625rem',
                            }}
                        >
                            {t('cta.start')} <Icon name="arrowR" size={18} />
                        </button>
                        {/* TODO: Fazer animacao de hover desse botao */}
                        <button
                            onClick={() => goToSection('demo')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 9,
                                height: 54,
                                padding: '0 24px',
                                borderRadius: 2,
                                background: 'transparent',
                                color: '#fff',
                                border: '1px solid #727273',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontWeight: 700,
                                fontSize: 16,
                                letterSpacing: '.0625rem',
                                boxShadow:
                                    '-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)',
                                transition: 'all .3s ease',
                            }}
                        >
                            <Icon name="play" size={16} /> {t('cta.demo')}
                        </button>
                    </Reveal>

                    <Reveal
                        delay={300}
                        style={{
                            display: 'flex',
                            gap: 10,
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            marginTop: 30,
                        }}
                    >
                        {platBadges.map((b, i) => (
                            <PlatformBadge key={i} {...b} />
                        ))}
                    </Reveal>
                </div>

                {/* composição visual */}
                <Reveal
                    delay={260}
                    y={28}
                    style={{
                        position: 'relative',
                        margin: '0 auto',
                        width: '100%',
                        maxWidth: 760,
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            transform: `translateY(${py * -0.04}px)`,
                            transition: 'transform .1s linear',
                        }}
                    >
                        <div className="lp-float-a">
                            <BrowserFrame url="app.mangareader.com/biblioteca">
                                <div style={{ height: 430 }}>
                                    <LibraryScreen />
                                </div>
                            </BrowserFrame>
                        </div>

                        <div
                            className="lp-hero-phone lp-float-b"
                            style={{
                                position: 'absolute',
                                right: '-2%',
                                bottom: '-12%',
                                transform: `translateY(${py * 0.05}px)`,
                            }}
                        >
                            <PhoneFrame w={200} label="App Manga Reader">
                                <ReaderScreen />
                            </PhoneFrame>
                        </div>

                        <FloatChip
                            icon="zap"
                            label={t('hero.floatNew')}
                            accent
                            style={{ top: '6%', left: '-4%' }}
                            className="lp-chip lp-float-b"
                        />
                        <FloatChip
                            icon="sync"
                            label={t('hero.floatSync')}
                            style={{ top: '-5%', right: '14%' }}
                            className="lp-chip"
                        />
                        <FloatChip
                            icon="bookmark"
                            label={t('hero.floatContinue')}
                            accent
                            style={{ bottom: '24%', left: '-7%' }}
                            className="lp-chip"
                        />
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
