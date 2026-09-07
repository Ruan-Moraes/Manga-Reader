import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AnimatedNumber from '@/shared/component/AnimatedNumber';
import Icon from '@/shared/component/Icon';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import Reveal from '@/shared/component/Reveal';
import { usePublicStats } from '@/feature/stats/hook/usePublicStats';
import { STATS_META, type StatText } from '@/shared/data/landing';

export default function Stats() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const { data: stats, isLoading } = usePublicStats();
    const items = t('stats.items', { returnObjects: true }) as StatText[];
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new IntersectionObserver(
            entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.25 },
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const values = items.map((item, index) => {
        if (stats && index === 0) return `+${stats.totalTitles}`;
        if (stats && index === 1) return `+${stats.totalChapters}`;
        return item.value;
    });

    return (
        <MarketingSection key={locale} id="stats">
            <SectionHeading
                eyebrow={t('stats.eyebrow')}
                title={t('stats.title')}
            />
            <div
                ref={ref}
                className="mt-10 grid grid-cols-1 gap-3 min-[560px]:grid-cols-3 min-[560px]:gap-4 md:grid-cols-5"
            >
                {items.map((item, index) => (
                    <Reveal
                        key={item.label}
                        delay={index * 60}
                        className="flex min-h-40 flex-col items-center justify-center rounded-[14px] border border-border bg-card px-3.5 py-6 text-center text-accent-fg"
                    >
                        <Icon name={STATS_META[index]} size={26} />
                        {isLoading ? (
                            <>
                                <span className="mt-3.5 h-[30px] w-[62%] animate-shimmer rounded bg-[linear-gradient(90deg,var(--color-surface-muted),var(--color-surface-elevated),var(--color-surface-muted))] bg-[length:200%_100%]" />
                                <span className="mt-2.5 h-3 w-[80%] animate-shimmer rounded bg-[linear-gradient(90deg,var(--color-surface-muted),var(--color-surface-elevated),var(--color-surface-muted))] bg-[length:200%_100%]" />
                            </>
                        ) : (
                            <>
                                <strong className="mt-3.5 text-[clamp(1.65rem,3vw,2.15rem)] leading-none text-fg">
                                    <AnimatedNumber
                                        value={values[index]}
                                        locale={i18n.language}
                                        run={inView}
                                    />
                                </strong>
                                <span className="mt-2.5 text-[0.8125rem] font-bold leading-[1.4] text-copy-muted">
                                    {item.label}
                                </span>
                            </>
                        )}
                    </Reveal>
                ))}
            </div>
        </MarketingSection>
    );
}
