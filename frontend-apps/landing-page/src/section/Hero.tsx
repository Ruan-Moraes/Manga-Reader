import { useTranslation } from 'react-i18next';

import { usePublicStats } from '@/feature/stats/hook/usePublicStats';
import useInView from '@/shared/hook/useInView';

export default function Hero() {
    const { t } = useTranslation();

    const { data: stats } = usePublicStats();
    const { ref, inView } = useInView();

    return (
        <section
            ref={ref}
            className={`relative min-h-[90vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden ${inView ? 'animate-fade-up' : 'animate-hidden'}`}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-accent-5 blur-[120px]" />
            </div>
            <div className="relative z-10 max-w-3xl mx-auto">
                {stats && (
                    <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
                        <span className="rounded-full border border-accent-muted bg-accent-subtle px-4 py-1 text-sm text-accent font-semibold">
                            {stats.totalTitles.toLocaleString('pt-BR')}+{' '}
                            {t('hero.badge_works')}
                        </span>
                        <span className="rounded-full border border-accent-muted bg-accent-subtle px-4 py-1 text-sm text-accent font-semibold">
                            {stats.totalChapters.toLocaleString('pt-BR')}+{' '}
                            {t('hero.badge_chapters')}
                        </span>
                    </div>
                )}
                <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
                    {t('hero.headline')}
                </h1>
                <p className="mt-6 text-lg text-tertiary max-w-xl mx-auto leading-relaxed">
                    {t('hero.subheadline')}
                </p>
                <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
                    <a
                        href="#plans"
                        className="rounded-lg bg-accent px-8 py-3 font-bold text-primary hover:bg-accent-hover transition-colors"
                    >
                        {t('hero.cta_primary')}
                    </a>
                    <a
                        href="#features"
                        className="rounded-lg border border-tertiary px-8 py-3 font-semibold text-white hover:border-accent hover:text-accent transition-colors"
                    >
                        {t('hero.cta_secondary')}
                    </a>
                </div>
            </div>
        </section>
    );
}
