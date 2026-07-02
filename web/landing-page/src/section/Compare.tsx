import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';
import { Section, SectionTitle } from '@/shared/component/Primitives';
import Reveal from '@/shared/component/Reveal';

import { COMPARE_ROWS, type CompareValue } from '@/shared/data/landing';

function CompareCell({ v, limited }: { v: CompareValue; limited: string }) {
    if (v === 'yes') return <Icon name="check" size={20} stroke={3} style={{ color: '#ddda2a' }} />;
    if (v === 'no') return <Icon name="x" size={18} stroke={2.6} style={{ color: '#555' }} />;

    return <span style={{ fontSize: 12, fontWeight: 700, color: '#FF784F', letterSpacing: '.0625rem' }}>{limited}</span>;
}

export default function Compare() {
    const { t } = useTranslation();

    const features = t('compare.features', { returnObjects: true }) as string[];
    const limited = t('compare.limited');

    const cols = '1.6fr 1fr 1fr';

    return (
        <Section id="compare">
            <SectionTitle eyebrow={t('compare.eyebrow')} title={t('compare.title')} />
            <Reveal delay={80} style={{ maxWidth: 760, margin: '44px auto 0' }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #444', background: 'var(--color-secondary)' }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: cols,
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid #444',
                        }}
                    >
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#727273', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                            {t('compare.colFeature')}
                        </span>
                        <span style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#cccccc', letterSpacing: '.0625rem' }}>
                            {t('compare.colFree')}
                        </span>
                        <span style={{ textAlign: 'center', display: 'inline-flex', justifyContent: 'center' }}>
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 12px',
                                    borderRadius: 999,
                                    background: 'rgba(221,218,42,0.14)',
                                    border: '1px solid rgba(221,218,42,0.5)',
                                    color: '#ddda2a',
                                    fontSize: 13,
                                    fontWeight: 800,
                                    letterSpacing: '.0625rem',
                                }}
                            >
                                <Icon name="zap" size={13} />
                                {t('compare.colPremium')}
                            </span>
                        </span>
                    </div>
                    {features.map((f, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: cols,
                                alignItems: 'center',
                                padding: '15px 20px',
                                borderBottom: i < features.length - 1 ? '1px solid #2d2d2d' : 'none',
                                background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent',
                            }}
                        >
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{f}</span>
                            <span style={{ display: 'flex', justifyContent: 'center' }}>
                                <CompareCell v={COMPARE_ROWS[i].free} limited={limited} />
                            </span>
                            <span style={{ display: 'flex', justifyContent: 'center' }}>
                                <CompareCell v={COMPARE_ROWS[i].premium} limited={limited} />
                            </span>
                        </div>
                    ))}
                </div>
            </Reveal>
        </Section>
    );
}
