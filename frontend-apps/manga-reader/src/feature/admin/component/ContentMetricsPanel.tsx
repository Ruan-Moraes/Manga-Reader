import { useTranslation } from 'react-i18next';

import type { ContentMetrics } from '../type/admin.types';

type ContentMetricsPanelProps = {
    metrics: ContentMetrics;
};

const TITLE_STATUS_COLORS: Record<string, string> = {
    ONGOING: 'bg-green-500/20 text-green-300',
    COMPLETED: 'bg-blue-500/20 text-blue-300',
    HIATUS: 'bg-yellow-500/20 text-yellow-300',
    CANCELLED: 'bg-red-500/20 text-red-300',
};

const EVENT_STATUS_COLORS: Record<string, string> = {
    HAPPENING_NOW: 'bg-green-500/20 text-green-300',
    REGISTRATIONS_OPEN: 'bg-blue-500/20 text-blue-300',
    COMING_SOON: 'bg-yellow-500/20 text-yellow-300',
    ENDED: 'bg-red-500/20 text-red-300',
};

const StatusBar = ({ label, count, total, colorClass }: { label: string; count: number; total: number; colorClass: string }) => {
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 font-semibold rounded-xs ${colorClass}`}>{label}</span>
                <span className="text-tertiary">
                    {count} ({percent}%)
                </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-xs bg-tertiary/30">
                <div className="h-full transition-all bg-quaternary-default" style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
};

const ContentMetricsPanel = ({ metrics }: ContentMetricsPanelProps) => {
    const { t } = useTranslation('admin');

    const totalTitles = Object.values(metrics.titlesByStatus).reduce((a, b) => a + b, 0);

    const totalEvents = Object.values(metrics.eventsByStatus).reduce((a, b) => a + b, 0);

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <div className="p-4 border rounded-xs bg-secondary border-tertiary">
                <h3 className="mb-3 text-sm font-semibold">
                    {t('dashboard.overview.metrics.titlesByStatus')} ({totalTitles})
                </h3>
                <div className="flex flex-col gap-2">
                    {Object.entries(metrics.titlesByStatus).map(([status, count]) => (
                        <StatusBar key={status} label={status} count={count} total={totalTitles} colorClass={TITLE_STATUS_COLORS[status] ?? 'bg-tertiary/30'} />
                    ))}
                </div>
            </div>

            <div className="p-4 border rounded-xs bg-secondary border-tertiary">
                <h3 className="mb-3 text-sm font-semibold">
                    {t('dashboard.overview.metrics.eventsByStatus')} ({totalEvents})
                </h3>
                <div className="flex flex-col gap-2">
                    {Object.entries(metrics.eventsByStatus).map(([status, count]) => (
                        <StatusBar key={status} label={status} count={count} total={totalEvents} colorClass={EVENT_STATUS_COLORS[status] ?? 'bg-tertiary/30'} />
                    ))}
                </div>
            </div>

            <div className="p-4 border rounded-xs bg-secondary border-tertiary lg:col-span-2">
                <h3 className="mb-3 text-sm font-semibold">{t('dashboard.overview.metrics.top10titles')}</h3>
                {metrics.topTitles.length === 0 ? (
                    <p className="text-sm text-tertiary">{t('dashboard.overview.metrics.noTitlesAvailable')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-tertiary">
                                    <th className="py-2 text-left font-medium text-tertiary w-8">{t('dashboard.overview.metrics.columns.rank')}</th>
                                    <th className="py-2 text-left font-medium text-tertiary">{t('dashboard.overview.metrics.columns.title')}</th>
                                    <th className="py-2 text-left font-medium text-tertiary">{t('dashboard.overview.metrics.columns.type')}</th>
                                    <th className="py-2 text-right font-medium text-tertiary">{t('dashboard.overview.metrics.columns.rankingScore')}</th>
                                    <th className="py-2 text-right font-medium text-tertiary">{t('dashboard.overview.metrics.columns.rating')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.topTitles.map((title, idx) => (
                                    <tr key={title.id} className="border-b border-tertiary/30">
                                        <td className="py-2 font-mono text-xs text-tertiary">{idx + 1}</td>
                                        <td className="py-2 font-medium">{title.name}</td>
                                        <td className="py-2 text-xs text-tertiary">{title.type ?? '—'}</td>
                                        <td className="py-2 text-right">{title.rankingScore?.toFixed(1) ?? '—'}</td>
                                        <td className="py-2 text-right text-xs text-tertiary">
                                            {title.ratingAverage?.toFixed(1) ?? '—'}
                                            {title.ratingCount ? ` (${title.ratingCount})` : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentMetricsPanel;
