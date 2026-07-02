import { useTranslation } from 'react-i18next';

import { PhoneFrame } from '@/shared/component/DeviceFrames';
import Icon from '@/shared/component/Icon';
import { LibraryScreen, ReaderScreen } from '@/shared/component/MockScreens';
import { Eyebrow, Section, StoreButton } from '@/shared/component/Primitives';
import Reveal from '@/shared/component/Reveal';

export default function MobileApp() {
    const { t } = useTranslation();

    const features = t('mobile.features', { returnObjects: true }) as string[];

    return (
        <Section id="app" alt>
            <div
                className="lp-mobile-grid"
                style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'clamp(40px,6vw,64px)', alignItems: 'center' }}
            >
                {/* mockups */}
                <Reveal y={26} style={{ position: 'relative', display: 'flex', justifyContent: 'center', minHeight: 380 }}>
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle at 50% 45%, rgba(221,218,42,0.08), transparent 60%)',
                        }}
                    />
                    <div className="lp-float-b" style={{ position: 'relative', zIndex: 2 }}>
                        <PhoneFrame w={224} label="Biblioteca no app">
                            <LibraryScreen />
                        </PhoneFrame>
                    </div>
                    <div
                        className="lp-mobile-phone2 lp-float-a"
                        style={{ position: 'absolute', right: '18%', bottom: '-4%', zIndex: 1, opacity: 0.92 }}
                    >
                        <PhoneFrame w={176} glow={false} label="Leitor no app">
                            <ReaderScreen />
                        </PhoneFrame>
                    </div>
                </Reveal>

                {/* texto */}
                <div>
                    <Reveal>
                        <Eyebrow>{t('mobile.eyebrow')}</Eyebrow>
                    </Reveal>
                    <Reveal
                        delay={60}
                        as="h2"
                        style={{
                            margin: 0,
                            fontWeight: 800,
                            color: '#fff',
                            letterSpacing: '.0625rem',
                            fontSize: 'clamp(26px,4.6vw,38px)',
                            lineHeight: 1.14,
                            textWrap: 'balance',
                        }}
                    >
                        {t('mobile.title')}
                    </Reveal>
                    <Reveal delay={120} as="p" style={{ margin: '16px 0 0', maxWidth: 480, color: '#999', fontSize: 16, lineHeight: 1.6 }}>
                        {t('mobile.sub')}
                    </Reveal>

                    <ul style={{ listStyle: 'none', margin: '26px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
                        {features.map((f, i) => (
                            <Reveal
                                key={i}
                                delay={150 + i * 60}
                                as="li"
                                style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontSize: 15, fontWeight: 600 }}
                            >
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 24,
                                        height: 24,
                                        borderRadius: 999,
                                        background: 'rgba(221,218,42,0.15)',
                                        border: '1px solid rgba(221,218,42,0.45)',
                                        color: '#ddda2a',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon name="check" size={14} stroke={3} />
                                </span>
                                {f}
                            </Reveal>
                        ))}
                    </ul>

                    <Reveal delay={260} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 32 }}>
                        <StoreButton kind="apple" line1={t('mobile.appStore')} line2={t('mobile.appStoreName')} />
                        <StoreButton kind="play" line1={t('mobile.googlePlay')} line2={t('mobile.googlePlayName')} />
                    </Reveal>
                </div>
            </div>
        </Section>
    );
}
