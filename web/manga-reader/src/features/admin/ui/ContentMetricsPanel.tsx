import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';

import type { ContentMetrics } from '../model/admin.types';
import { EVENT_STATUS_TONE, TITLE_STATUS_TONE, statusLabelKey, toneFor } from '../model/statusTone';
import { toneFillClass } from '@ui/StatusPill';
import { getLocale } from '@shared/lib/formatters';
import { cn } from '@shared/lib/cn';

type ContentMetricsPanelProps = {
    metrics: ContentMetrics;
};

type DistRow = { key: string; label: string; count: number; toneClass: string };

const DistCard = ({ title, total, rows }: { title: string; total: number; rows: DistRow[] }) => {
    const { t } = useTranslation('admin');
    const max = Math.max(...rows.map(r => r.count), 1);

    return (
        <div className="rounded-mr-md border border-mr-border bg-mr-surface p-[18px]">
            <div className="mb-4 flex items-center justify-between gap-2.5">
                <h3 className="text-[15px] font-mr-bold text-mr-fg">{title}</h3>
                <span className="text-mr-small text-mr-fg-subtle">{t('dashboard.overview.metrics.totalCount', { count: total })}</span>
            </div>
            <div>
                {rows.map(r => {
                    const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;

                    return (
                        <div key={r.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-t border-mr-gray-900 py-2.5 first:border-t-0">
                            <span className="flex items-center gap-2 text-mr-small font-mr-semibold text-mr-fg">
                                <span className={cn('size-[9px] shrink-0 rounded-mr-xs', r.toneClass)} />
                                {r.label}
                            </span>
                            <span className="whitespace-nowrap text-mr-small font-mr-bold tabular-nums text-mr-fg-subtle">
                                {r.count} · {pct}%
                            </span>
                            <span className="col-span-2 mt-0.5 h-1.5 overflow-hidden rounded-mr-full bg-mr-gray-900">
                                <span className={cn('block h-full rounded-mr-full transition-all duration-mr-slow', r.toneClass)} style={{ width: `${(r.count / max) * 100}%` }} />
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ContentMetricsPanel = ({ metrics }: ContentMetricsPanelProps) => {
    const { t } = useTranslation('admin');

    const totalTitles = Object.values(metrics.titlesByStatus).reduce((a, b) => a + b, 0);
    const totalEvents = Object.values(metrics.eventsByStatus).reduce((a, b) => a + b, 0);

    const titleRows: DistRow[] = Object.entries(metrics.titlesByStatus).map(([status, count]) => ({
        key: status,
        label: t(statusLabelKey('title', status), { defaultValue: status }),
        count,
        toneClass: toneFillClass[toneFor(TITLE_STATUS_TONE, status)],
    }));

    const eventRows: DistRow[] = Object.entries(metrics.eventsByStatus).map(([status, count]) => ({
        key: status,
        label: t(statusLabelKey('event', status), { defaultValue: status }),
        count,
        toneClass: toneFillClass[toneFor(EVENT_STATUS_TONE, status)],
    }));

    return (
        <>
            <div className="grid gap-4 lg:grid-cols-2">
                <DistCard title={t('dashboard.overview.metrics.titlesByStatus')} total={totalTitles} rows={titleRows} />
                <DistCard title={t('dashboard.overview.metrics.eventsByStatus')} total={totalEvents} rows={eventRows} />
            </div>

            <h2 className="mt-7 mb-3.5 text-[18px] font-mr-bold tracking-mr text-mr-fg">{t('dashboard.overview.metrics.top10titles')}</h2>

            {metrics.topTitles.length === 0 ? (
                <div className="rounded-mr-md border border-mr-border bg-mr-surface px-[18px] py-5">
                    <p className="text-mr-small text-mr-fg-subtle">{t('dashboard.overview.metrics.noTitlesAvailable')}</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-mr-md border border-mr-border bg-mr-surface">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[460px] border-collapse text-mr-small">
                            <thead>
                                <tr className="bg-mr-surface-muted">
                                    <th className="w-11 border-b border-mr-border px-4 py-3 text-left text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-fg-subtle">
                                        {t('dashboard.overview.metrics.columns.rank')}
                                    </th>
                                    <th className="border-b border-mr-border px-4 py-3 text-left text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-fg-subtle">
                                        {t('dashboard.overview.metrics.columns.title')}
                                    </th>
                                    <th className="border-b border-mr-border px-4 py-3 text-left text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-fg-subtle">
                                        {t('dashboard.overview.metrics.columns.type')}
                                    </th>
                                    <th className="border-b border-mr-border px-4 py-3 text-right text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-fg-subtle">
                                        {t('dashboard.overview.metrics.columns.rating')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.topTitles.map((title, idx) => (
                                    <tr key={title.id} className="border-b border-mr-gray-900 transition-colors last:border-b-0 hover:bg-mr-surface-muted">
                                        <td className="px-4 py-3">
                                            <span className={cn('font-mr-extrabold tabular-nums', idx === 0 ? 'text-mr-accent' : 'text-mr-tertiary')}>{idx + 1}</span>
                                        </td>
                                        <td className="px-4 py-3 font-mr-bold text-mr-fg">{title.name}</td>
                                        <td className="px-4 py-3 text-mr-fg-subtle">{title.type ?? '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center justify-end gap-2">
                                                <Star size={13} className="fill-mr-accent text-mr-accent" />
                                                <span className="font-mr-bold tabular-nums text-mr-fg">{title.ratingAverage?.toFixed(1) ?? '—'}</span>
                                                {title.ratingCount ? <span className="text-mr-tiny text-mr-fg-subtle">({title.ratingCount.toLocaleString(getLocale())})</span> : null}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
};

export default ContentMetricsPanel;
