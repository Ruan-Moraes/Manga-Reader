import { useTranslation } from 'react-i18next';

import AnimatedCounter from '@/shared/component/AnimatedCounter';

import { usePublicStats } from '@/feature/stats/hook/usePublicStats';
import useInView from '@/shared/hook/useInView';

export default function Catalog() {
    const { t } = useTranslation();

    const { data: stats, isLoading, isError } = usePublicStats();
    const { ref, inView } = useInView();

    return (
        <section
            id="catalog"
            className={`py-24 px-4 bg-secondary ${inView ? 'animate-fade-up' : 'animate-hidden'}`}
            ref={ref}
        >
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-white mb-16">
                    {t('catalog.title')}
                </h2>
                {isError ? (
                    <p className="text-red-400">{t('catalog.error')}</p>
                ) : isLoading ? (
                    <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-16 w-32 rounded bg-tertiary animate-pulse" />
                            <div className="h-6 w-40 rounded bg-tertiary animate-pulse" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-16 w-32 rounded bg-tertiary animate-pulse" />
                            <div className="h-6 w-40 rounded bg-tertiary animate-pulse" />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
                        <div className="flex flex-col items-center gap-2">
                            <AnimatedCounter
                                target={stats?.totalTitles ?? 0}
                                className="text-6xl font-extrabold text-accent"
                                suffix="+"
                            />
                            <p className="text-tertiary text-lg">
                                {t('catalog.works_label')}
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <AnimatedCounter
                                target={stats?.totalChapters ?? 0}
                                className="text-6xl font-extrabold text-accent"
                                suffix="+"
                            />
                            <p className="text-tertiary text-lg">
                                {t('catalog.chapters_label')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
