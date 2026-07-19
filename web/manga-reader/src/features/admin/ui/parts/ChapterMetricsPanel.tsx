import { useTranslation } from 'react-i18next';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpenCheck, Clock3, Heart, Users } from 'lucide-react';

import { Skeleton } from '@ui/Skeleton';
import { getLocale } from '@shared/lib/formatters';
import type { SeriesPoint } from '@entities/chapter';

import MetricsCard from '../MetricsCard';
import useChapterAnalytics from '../../model/useChapterAnalytics';
import ChapterMetricsFilters from './ChapterMetricsFilters';

type ChapterMetricsPanelProps = {
    chapterId: string;
    titleId: string;
};

const percent = (value: number) => `${Math.round(value * 100)}%`;
const signedPercent = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`;
const minutes = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

const formatDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(getLocale(), { day: '2-digit', month: 'short' });

const SeriesTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number | string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-mr-xs border border-mr-border bg-mr-surface p-2.5 text-mr-small shadow-mr-black">
            <p className="font-mr-bold text-mr-fg">{label}</p>
            <p className="text-mr-fg-subtle">{Number(payload[0].value).toLocaleString(getLocale())}</p>
        </div>
    );
};

/**
 * Painel de métricas de um capítulo: cards, comparações, distribuição por
 * dispositivo/plataforma e evolução de leituras. Dados recuperados via
 * ChapterAnalyticsGateway (determinísticos por capítulo+filtro).
 */
const ChapterMetricsPanel = ({ chapterId, titleId }: ChapterMetricsPanelProps) => {
    const { t } = useTranslation('admin');
    const analytics = useChapterAnalytics({ chapterId, titleId }, { overview: false });
    const metrics = analytics.metrics;

    if (analytics.isLoadingMetrics || !metrics) {
        return (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                ))}
            </div>
        );
    }

    const deviceData = Object.entries(metrics.readsByDevice).map(([device, reads]) => ({
        label: t(`dashboard.chapters.metrics.device.${device}`),
        reads,
    }));
    const platformData = Object.entries(metrics.readsByPlatform).map(([platform, reads]) => ({
        label: t(`dashboard.chapters.metrics.platform.${platform}`),
        reads,
    }));

    const comparisonRows: [string, string][] = [
        [t('dashboard.chapters.metrics.avgReadPct'), percent(metrics.avgReadPct)],
        [t('dashboard.chapters.metrics.abandonCount'), metrics.abandonCount.toLocaleString(getLocale())],
        [t('dashboard.chapters.metrics.avgAbandonPage'), String(metrics.avgAbandonPage)],
        [t('dashboard.chapters.metrics.favoritesAfterRead'), metrics.favoritesAfterRead.toLocaleString(getLocale())],
        [t('dashboard.chapters.metrics.first24h'), metrics.first24hReads.toLocaleString(getLocale())],
        [t('dashboard.chapters.metrics.first7d'), metrics.first7dReads.toLocaleString(getLocale())],
        [
            t('dashboard.chapters.metrics.vsPrevious'),
            metrics.vsPreviousChapter ? signedPercent(metrics.vsPreviousChapter.reads) : t('dashboard.chapters.metrics.firstChapter'),
        ],
        [t('dashboard.chapters.metrics.vsTitleAverage'), signedPercent(metrics.vsTitleAverage.reads)],
        [t('dashboard.chapters.metrics.firstReadAt'), metrics.firstReadAt ? new Date(metrics.firstReadAt).toLocaleDateString(getLocale()) : '—'],
        [t('dashboard.chapters.metrics.lastReadAt'), metrics.lastReadAt ? new Date(metrics.lastReadAt).toLocaleDateString(getLocale()) : '—'],
    ];

    const renderBars = (data: { label: string; reads: number }[], titleKey: string) => (
        <div className="rounded-mr-md border border-mr-border bg-mr-surface p-[18px]">
            <h3 className="mb-4 text-[15px] font-mr-bold text-mr-fg">{t(titleKey)}</h3>
            <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barCategoryGap="28%">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--mr-border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: 'var(--mr-fg-subtle)', fontSize: 12 }} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--mr-fg-subtle)', fontSize: 12 }} tickLine={false} />
                        <Tooltip content={<SeriesTooltip />} cursor={{ fill: 'var(--mr-surface-elevated)' }} />
                        <Bar dataKey="reads" fill="var(--mr-accent)" radius={[4, 4, 0, 0]} maxBarSize={42} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-4">
            <ChapterMetricsFilters filter={analytics.filter} onChange={analytics.setFilter} />

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                <MetricsCard label={t('dashboard.chapters.metrics.totalReads')} value={metrics.totalReads} icon={<BookOpenCheck size={20} />} />
                <MetricsCard label={t('dashboard.chapters.metrics.uniqueReaders')} value={metrics.uniqueReaders} icon={<Users size={20} />} />
                <MetricsCard label={t('dashboard.chapters.metrics.avgReadTime')} value={minutes(metrics.avgReadTimeSec)} icon={<Clock3 size={20} />} />
                <MetricsCard label={t('dashboard.chapters.metrics.completionRate')} value={percent(metrics.completionRate)} icon={<Heart size={20} />} />
            </div>

            <div className="rounded-mr-md border border-mr-border bg-mr-surface p-[18px]">
                <h3 className="mb-4 text-[15px] font-mr-bold text-mr-fg">{t('dashboard.chapters.metrics.readsEvolution')}</h3>
                <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.series.map((point: SeriesPoint) => ({ ...point, label: formatDay(point.date) }))}>
                            <defs>
                                <linearGradient id="chapterReadsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--mr-accent)" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="var(--mr-accent)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--mr-border)" />
                            <XAxis dataKey="label" tick={{ fill: 'var(--mr-fg-subtle)', fontSize: 12 }} tickLine={false} minTickGap={24} />
                            <YAxis tick={{ fill: 'var(--mr-fg-subtle)', fontSize: 12 }} tickLine={false} />
                            <Tooltip content={<SeriesTooltip />} cursor={{ stroke: 'var(--mr-tertiary)' }} />
                            <Area type="monotone" dataKey="value" stroke="var(--mr-accent-border)" strokeWidth={2} fill="url(#chapterReadsGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {renderBars(deviceData, 'dashboard.chapters.metrics.readsByDevice')}
                {renderBars(platformData, 'dashboard.chapters.metrics.readsByPlatform')}
            </div>

            <div className="rounded-mr-md border border-mr-border bg-mr-surface p-5">
                <h3 className="mb-3 text-[15px] font-mr-bold text-mr-fg">{t('dashboard.chapters.metrics.detailsTitle')}</h3>
                <dl className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                    {comparisonRows.map(([label, value]) => (
                        <div key={label} className="flex items-baseline justify-between gap-4 border-b border-mr-gray-900 pb-2 last:border-b-0">
                            <dt className="text-mr-small text-mr-fg-subtle">{label}</dt>
                            <dd className="text-right text-mr-small font-mr-bold tabular-nums text-mr-fg">{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
};

export default ChapterMetricsPanel;
