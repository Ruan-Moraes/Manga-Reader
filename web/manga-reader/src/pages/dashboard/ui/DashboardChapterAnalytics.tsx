import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@ui/Button';
import DataTable, { type Column } from '@ui/DataTable';
import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { getLocale } from '@shared/lib/formatters';
import type { ChapterMetricsSummaryRow } from '@entities/chapter';
import { ChapterMetricsFilters, useChapterAnalytics } from '@features/admin';

/**
 * Analytics global de capítulos: visão comparativa (tabela paginada) com
 * filtros de período/dispositivo/plataforma aplicados no gateway fake.
 */
const DashboardChapterAnalytics = () => {
    const { t } = useTranslation('admin');
    const appNavigate = useAppNavigate();
    const analytics = useChapterAnalytics();

    const columns: Column<ChapterMetricsSummaryRow>[] = [
        {
            key: 'chapterNumber',
            header: t('dashboard.chapters.columnNumber'),
            render: row => <span className="tabular-nums font-mr-bold text-mr-fg">{row.chapterNumber}</span>,
        },
        {
            key: 'chapterTitle',
            header: t('dashboard.chapters.columnTitle'),
            render: row => (
                <div className="min-w-0">
                    <div className="truncate font-mr-bold text-mr-fg">{row.chapterTitle}</div>
                    <div className="truncate text-mr-tiny text-mr-fg-subtle">{row.titleName}</div>
                </div>
            ),
        },
        {
            key: 'totalReads',
            header: t('dashboard.chapters.metrics.totalReads'),
            align: 'right',
            render: row => <span className="tabular-nums text-mr-fg">{row.totalReads.toLocaleString(getLocale())}</span>,
        },
        {
            key: 'uniqueReaders',
            header: t('dashboard.chapters.metrics.uniqueReaders'),
            align: 'right',
            hideBelow: 'sm',
            render: row => <span className="tabular-nums text-mr-fg-subtle">{row.uniqueReaders.toLocaleString(getLocale())}</span>,
        },
        {
            key: 'completionRate',
            header: t('dashboard.chapters.metrics.completionRate'),
            align: 'right',
            hideBelow: 'md',
            render: row => <span className="tabular-nums text-mr-fg-subtle">{Math.round(row.completionRate * 100)}%</span>,
        },
        {
            key: 'avgReadTimeSec',
            header: t('dashboard.chapters.metrics.avgReadTime'),
            align: 'right',
            hideBelow: 'md',
            render: row => <span className="tabular-nums text-mr-fg-subtle">{Math.floor(row.avgReadTimeSec / 60)}m</span>,
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => appNavigate(ROUTES.DASHBOARD_CHAPTERS)}>
                    {t('common.back')}
                </Button>
                <div>
                    <h1 className="text-[26px] font-mr-extrabold leading-tight text-mr-fg md:text-[30px]">{t('dashboard.chapters.metrics.overviewTitle')}</h1>
                    <p className="mt-1.5 text-mr-small text-mr-fg-subtle">{t('dashboard.chapters.metrics.overviewSubtitle')}</p>
                </div>
            </div>

            <ChapterMetricsFilters filter={analytics.filter} onChange={analytics.setFilter} />

            <DataTable
                columns={columns}
                data={analytics.overview?.content ?? []}
                keyExtractor={row => row.chapterId}
                page={analytics.page}
                totalPages={analytics.overview?.totalPages ?? 0}
                onPageChange={analytics.setPage}
                isLoading={analytics.isLoading}
                isError={analytics.isError}
                emptyTitle={t('dashboard.chapters.emptyTitle')}
                emptyMessage={t('dashboard.chapters.metrics.overviewEmpty')}
                onRowClick={row => appNavigate(ROUTES.DASHBOARD_CHAPTER_DETAIL(row.chapterId))}
            />
        </div>
    );
};

export default DashboardChapterAnalytics;
