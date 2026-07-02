import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Icon, { type IconName } from '@/shared/component/Icon';
import { accentButton } from '@/shared/component/PricingCard';
import { Section, SectionTitle } from '@/shared/component/Primitives';
import Reveal from '@/shared/component/Reveal';

import type { GiftStep } from '@/shared/data/landing';

type Tab = 'give' | 'redeem';

const APP_URL = import.meta.env.VITE_APP_URL ?? '';

export default function Gift() {
    const { t } = useTranslation();

    const [tab, setTab] = useState<Tab>('give');
    const [code, setCode] = useState('');

    const steps = t('gift.steps', { returnObjects: true }) as GiftStep[];

    function handleGive() {
        window.location.href = `${APP_URL}/subscription?action=gift`;
    }

    function handleRedeem() {
        const trimmed = code.trim();

        window.location.href = trimmed
            ? `${APP_URL}/subscription/redeem?code=${encodeURIComponent(trimmed)}`
            : `${APP_URL}/subscription/redeem`;
    }

    const tabButtons: [Tab, string, IconName][] = [
        ['give', t('gift.tabGive'), 'gift'],
        ['redeem', t('gift.tabRedeem'), 'ticket'],
    ];

    return (
        <Section id="gift" alt>
            <SectionTitle eyebrow={t('gift.eyebrow')} title={t('gift.title')} sub={t('gift.sub')} />

            <Reveal delay={80} style={{ display: 'flex', justifyContent: 'center', marginTop: 34 }}>
                <div
                    role="tablist"
                    aria-label={t('gift.tablistLabel')}
                    style={{
                        display: 'inline-flex',
                        gap: 4,
                        padding: 5,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid #444',
                    }}
                >
                    {tabButtons.map(([id, label, ic]) => {
                        const on = tab === id;

                        return (
                            <button
                                key={id}
                                role="tab"
                                aria-selected={on}
                                onClick={() => setTab(id)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    height: 42,
                                    padding: '0 22px',
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
                                <Icon name={ic} size={16} />
                                {label}
                            </button>
                        );
                    })}
                </div>
            </Reveal>

            <Reveal delay={130} style={{ maxWidth: 860, margin: '34px auto 0' }}>
                {tab === 'give' ? (
                    <div key="give" className="lp-fade-in">
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,190px),1fr))',
                                gap: 16,
                            }}
                        >
                            {steps.map((st, i) => (
                                <div key={i} style={{ padding: 20, borderRadius: 8, background: 'var(--color-primary)', border: '1px solid #444' }}>
                                    <div
                                        style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: 999,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: '#ddda2a',
                                            color: '#161616',
                                            fontWeight: 800,
                                            fontSize: 15,
                                            marginBottom: 14,
                                        }}
                                    >
                                        {i + 1}
                                    </div>
                                    <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '.0625rem' }}>
                                        {st.t}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: 13, color: '#999', lineHeight: 1.5 }}>{st.d}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
                            <button
                                onClick={handleGive}
                                style={{ ...accentButton(), width: 'auto', padding: '0 30px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                            >
                                <Icon name="gift" size={17} />
                                {t('gift.giveCta')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div key="redeem" className="lp-fade-in" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
                        <div style={{ padding: 28, borderRadius: 12, background: 'var(--color-primary)', border: '1px solid #444' }}>
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 52,
                                    height: 52,
                                    borderRadius: 999,
                                    background: 'rgba(221,218,42,0.12)',
                                    border: '1px solid rgba(221,218,42,0.4)',
                                    color: '#ddda2a',
                                    margin: '0 auto 16px',
                                }}
                            >
                                <Icon name="ticket" size={24} />
                            </div>
                            <label
                                htmlFor="gift-code"
                                style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#cccccc', marginBottom: 10, letterSpacing: '.0625rem' }}
                            >
                                {t('gift.redeemLabel')}
                            </label>
                            <input
                                id="gift-code"
                                type="text"
                                className="mr-input"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder={t('gift.redeemPlaceholder')}
                                style={{ textAlign: 'center', fontWeight: 700, letterSpacing: '.15em', height: 48, textTransform: 'uppercase' }}
                            />
                            <button onClick={handleRedeem} style={{ ...accentButton(), marginTop: 16 }}>
                                {t('gift.redeemCta')}
                            </button>
                            <p style={{ margin: '14px 0 0', fontSize: 12, color: '#727273', lineHeight: 1.5 }}>{t('gift.redeemHint')}</p>
                        </div>
                    </div>
                )}
            </Reveal>
        </Section>
    );
}
