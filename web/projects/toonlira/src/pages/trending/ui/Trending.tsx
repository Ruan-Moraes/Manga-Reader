import { Activity, Info, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTrendingDashboard, type TrendWindow } from '@entities/trend';
import { PageContainer } from '@ui/PageContainer';
import { SegmentedControl } from '@ui/SegmentedControl';

import TrendingSection from './parts/TrendingSection';
import MetricLeaderboards from './parts/MetricLeaderboards';

const Trending = () => {
    const { t } = useTranslation('home');
    const [window, setWindow] = useState<TrendWindow>('WEEK');
    const { data, isLoading, isError } = useTrendingDashboard(window);
    const periodItems = [
        { value: 'DAY', label: t('trending.periodToday') },
        { value: 'WEEK', label: t('trending.periodWeek') },
        { value: 'MONTH', label: t('trending.periodMonth') },
    ];
    return (
        <PageContainer asMain size="default" paddingY="md">
            <section className="relative mb-8 overflow-hidden rounded-ui-sm border border-ui-border bg-ui-surface p-6 md:p-9">
                <div className="absolute -right-16 -top-20 size-64 rounded-full bg-ui-accent/10 blur-3xl" />
                <div className="relative max-w-3xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ui-accent-border/30 bg-ui-accent/10 px-3 py-1 text-ui-tiny font-ui-bold uppercase tracking-widest text-ui-accent-fg"><Activity className="size-3.5" />{t('trending.eyebrow')}</div>
                    <h1 className="text-ui-h2 font-ui-bold text-ui-fg md:text-ui-h1">{t('trending.title')}</h1>
                    <p className="mt-3 max-w-2xl text-ui-body text-ui-fg-muted">{t('trending.description')}</p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <SegmentedControl items={periodItems} value={window} onChange={value => setWindow(value as TrendWindow)} size="md" unified />
                        <span className="inline-flex items-center gap-1.5 text-ui-tiny text-ui-fg-subtle"><Info className="size-3.5" />{t('trending.meta')}</span>
                    </div>
                </div>
            </section>
            {isLoading ? <div className="flex min-h-64 items-center justify-center"><RefreshCw className="size-7 animate-spin text-ui-accent-fg" aria-label={t('trending.loading')} /></div>
                : isError ? <div className="rounded-ui-sm border border-ui-danger/30 bg-ui-danger/10 p-8 text-center text-ui-fg">{t('trending.error')}</div>
                : data ? <><TrendingSection items={data.momentum} /><MetricLeaderboards dashboard={data} /></> : null}
        </PageContainer>
    );
};

export default Trending;
