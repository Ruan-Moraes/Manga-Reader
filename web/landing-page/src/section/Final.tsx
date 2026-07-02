import { useTranslation } from 'react-i18next';

import Icon, { type IconName } from '@/shared/component/Icon';
import { PlatformBadge } from '@/shared/component/Primitives';
import Reveal from '@/shared/component/Reveal';

import { goToSection } from '@/shared/util/smoothScroll';

export default function Final() {
    const { t } = useTranslation();

    const badgeLabels = t('finalCta.badges', { returnObjects: true }) as string[];

    const badges: { icon: IconName; label: string; accent?: boolean }[] = [
        { icon: 'smartphone', label: badgeLabels[0], accent: true },
        { icon: 'smartphone', label: badgeLabels[1] },
        { icon: 'globe', label: badgeLabels[2] },
        { icon: 'wifiOff', label: badgeLabels[3], accent: true },
        { icon: 'noAds', label: badgeLabels[4] },
    ];

    return (
        <section id="final" style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(64px,10vw,120px) 20px' }}>
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at 50% 30%, rgba(221,218,42,0.12), transparent 60%)',
                }}
            />
            <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
                <Reveal
                    as="h2"
                    style={{
                        margin: 0,
                        fontWeight: 800,
                        color: '#fff',
                        letterSpacing: '.0625rem',
                        fontSize: 'clamp(30px,6vw,52px)',
                        lineHeight: 1.08,
                        textWrap: 'balance',
                    }}
                >
                    {t('finalCta.title')}
                </Reveal>
                <Reveal
                    delay={80}
                    as="p"
                    style={{ margin: '18px auto 0', maxWidth: 520, color: '#cccccc', fontSize: 'clamp(15px,2.6vw,18px)', lineHeight: 1.6 }}
                >
                    {t('finalCta.sub')}
                </Reveal>
                <Reveal delay={150} style={{ marginTop: 34 }}>
                    <button
                        onClick={() => goToSection('plans')}
                        className="lp-cta-pulse"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                            height: 56,
                            padding: '0 34px',
                            borderRadius: 2,
                            background: '#ddda2a',
                            color: '#161616',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontWeight: 800,
                            fontSize: 17,
                            letterSpacing: '.0625rem',
                        }}
                    >
                        {t('cta.subscribe')} <Icon name="arrowR" size={19} />
                    </button>
                </Reveal>
                <Reveal delay={210} style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 26 }}>
                    {badges.map((b, i) => (
                        <PlatformBadge key={i} {...b} />
                    ))}
                </Reveal>
                <Reveal delay={260} style={{ marginTop: 20 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#727273', fontSize: 13, letterSpacing: '.0625rem' }}>
                        <Icon name="shield" size={15} style={{ color: '#ddda2a' }} />
                        {t('finalCta.note')}
                    </span>
                </Reveal>
            </div>
        </section>
    );
}
