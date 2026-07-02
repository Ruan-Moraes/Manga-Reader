import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BrowserFrame, PhoneFrame } from '@/shared/component/DeviceFrames';
import Icon, { type IconName } from '@/shared/component/Icon';
import { MOCK_SCREENS, type MockScreenName } from '@/shared/component/MockScreens';
import { Section, SectionTitle } from '@/shared/component/Primitives';
import Reveal from '@/shared/component/Reveal';

interface DemoTab {
    id: string;
    label: string;
    icon: IconName;
    screen: MockScreenName;
    url: string;
}

export default function Demo() {
    const { t } = useTranslation();

    const tabs: DemoTab[] = [
        { id: 'library', label: t('demo.tabs.library'), icon: 'library', screen: 'LibraryScreen', url: 'app.mangareader.com/biblioteca' },
        { id: 'title', label: t('demo.tabs.title'), icon: 'eye', screen: 'TitleScreen', url: 'app.mangareader.com/obra/frieren' },
        { id: 'reader', label: t('demo.tabs.reader'), icon: 'play', screen: 'ReaderScreen', url: 'app.mangareader.com/ler/frieren-140' },
        { id: 'profile', label: t('demo.tabs.profile'), icon: 'user', screen: 'ProfileScreen', url: 'app.mangareader.com/perfil' },
    ];

    const [active, setActive] = useState('library');

    const cur = tabs.find(tb => tb.id === active) ?? tabs[0];
    const Screen = MOCK_SCREENS[cur.screen];

    return (
        <Section id="demo">
            <SectionTitle eyebrow={t('demo.eyebrow')} title={t('demo.title')} sub={t('demo.sub')} />

            <Reveal delay={80} style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
                <div
                    role="tablist"
                    aria-label={t('demo.tablistLabel')}
                    style={{
                        display: 'inline-flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 6,
                        padding: 6,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid #444',
                        maxWidth: '100%',
                    }}
                >
                    {tabs.map(tb => {
                        const on = tb.id === active;

                        return (
                            <button
                                key={tb.id}
                                role="tab"
                                aria-selected={on}
                                onClick={() => setActive(tb.id)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    height: 42,
                                    padding: '0 18px',
                                    borderRadius: 999,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    letterSpacing: '.0625rem',
                                    background: on ? '#ddda2a' : 'transparent',
                                    color: on ? '#161616' : '#cccccc',
                                    transition: 'all .3s ease',
                                }}
                            >
                                <Icon name={tb.icon} size={16} stroke={2.2} />
                                {tb.label}
                            </button>
                        );
                    })}
                </div>
            </Reveal>

            <Reveal delay={140} y={26} style={{ marginTop: 34, position: 'relative' }}>
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: '-6% 10% 0',
                        background: 'radial-gradient(ellipse at center, rgba(221,218,42,0.08), transparent 60%)',
                        pointerEvents: 'none',
                    }}
                />
                <div
                    className="lp-demo-stage"
                    style={{ position: 'relative', display: 'flex', gap: 28, alignItems: 'flex-end', justifyContent: 'center' }}
                >
                    <div style={{ flex: '1 1 660px', maxWidth: 880, minWidth: 0 }}>
                        <BrowserFrame url={cur.url}>
                            <div key={active} className="lp-fade-in" style={{ height: 460 }}>
                                <Screen />
                            </div>
                        </BrowserFrame>
                    </div>
                    <div className="lp-demo-phone" style={{ display: 'none', flex: '0 0 auto' }}>
                        <PhoneFrame w={208} label="App">
                            <div key={`${active}-m`} className="lp-fade-in" style={{ height: '100%' }}>
                                <Screen />
                            </div>
                        </PhoneFrame>
                    </div>
                </div>
            </Reveal>

            <Reveal delay={80} style={{ textAlign: 'center', marginTop: 24 }}>
                <span style={{ fontSize: 13, color: '#727273', letterSpacing: '.0625rem' }}>{t('demo.tip')}</span>
            </Reveal>
        </Section>
    );
}
