import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';
import { Section, SectionTitle } from '@/shared/component/Primitives';
import Reveal from '@/shared/component/Reveal';

import { usePublicStats } from '@/feature/stats/hook/usePublicStats';
import { STATS_META, type StatText } from '@/shared/data/landing';

function CountUp({ value, locale, run }: { value: string; locale: string; run: boolean }) {
    const match = String(value).match(/^(\D*)([\d.,]+)(.*)$/);
    const prefix = match ? match[1] : '';
    const target = match ? parseInt(match[2].replace(/[.,]/g, ''), 10) : 0;
    const suffix = match ? match[3] : '';

    const [n, setN] = useState(run ? 0 : target);

    useEffect(() => {
        if (!run || !match) {
            setN(target);
            return;
        }

        const reduce =
            window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduce) {
            setN(target);
            return;
        }

        let raf = 0;
        const dur = 1100;
        const t0 = performance.now();

        const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / dur);
            const e = 1 - Math.pow(1 - p, 3);
            setN(Math.round(e * target));

            if (p < 1) raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, target]);

    if (!match) return <>{value}</>;

    return (
        <>
            {prefix}
            {n.toLocaleString(locale)}
            {suffix}
        </>
    );
}

export default function Stats() {
    const { t, i18n } = useTranslation();

    const { data: stats, isLoading } = usePublicStats();

    const items = t('stats.items', { returnObjects: true }) as StatText[];

    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;

        if (!el) return;

        const io = new IntersectionObserver(
            entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        setInView(true);
                        io.disconnect();
                    }
                });
            },
            { threshold: 0.3 },
        );

        io.observe(el);

        return () => io.disconnect();
    }, []);

    const locale = i18n.language;

    // API com fallback estático: sobrescreve os dois primeiros valores quando há dados.
    const values = items.map((it, i) => {
        if (stats && i === 0) return `+${stats.totalTitles}`;
        if (stats && i === 1) return `+${stats.totalChapters}`;
        return it.value;
    });

    return (
        <Section id="stats">
            <SectionTitle eyebrow={t('stats.eyebrow')} title={t('stats.title')} />
            <div
                ref={ref}
                style={{
                    marginTop: 48,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 16,
                }}
            >
                {items.map((it, i) => (
                    <Reveal key={i} delay={i * 70}>
                        <div
                            style={{
                                height: '100%',
                                padding: '26px 18px',
                                borderRadius: 8,
                                textAlign: 'center',
                                background: 'var(--color-secondary)',
                                border: '1px solid #444',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#ddda2a' }}>
                                <Icon name={STATS_META[i]} size={26} stroke={2} />
                            </div>
                            {isLoading ? (
                                <>
                                    <div className="lp-skeleton" style={{ height: 30, width: '62%', margin: '0 auto 10px', borderRadius: 4 }} />
                                    <div className="lp-skeleton" style={{ height: 12, width: '80%', margin: '0 auto', borderRadius: 4 }} />
                                </>
                            ) : (
                                <>
                                    <div
                                        style={{
                                            fontSize: 'clamp(26px,4vw,34px)',
                                            fontWeight: 800,
                                            color: '#fff',
                                            letterSpacing: '.0625rem',
                                            lineHeight: 1,
                                        }}
                                    >
                                        <CountUp value={values[i]} locale={locale} run={inView} />
                                    </div>
                                    <div style={{ marginTop: 10, fontSize: 13, color: '#999', fontWeight: 600, lineHeight: 1.4 }}>
                                        {it.label}
                                    </div>
                                </>
                            )}
                        </div>
                    </Reveal>
                ))}
            </div>
        </Section>
    );
}
