import { useTranslation } from 'react-i18next';

import { AdminDashboardOverview, ContentMetricsPanel, useContentMetrics, useDashboardMetrics } from '@features/admin';
import { Button } from '@ui/Button';
import Illustration from '@ui/Illustration';

const DashboardOverview = () => {
    const { t } = useTranslation('admin');
    const { metrics, isLoading, isError, refetch } = useDashboardMetrics();
    const { metrics: contentMetrics, isLoading: isLoadingContent, isError: isErrorContent } = useContentMetrics();

    if (isLoading) {
        return (
            <div className="flex flex-col">
                <div className="mb-5 flex flex-col gap-2">
                    <div className="h-8 w-48 animate-mr-pulse rounded-mr-xs bg-mr-gray-800" />
                    <div className="h-4 w-64 animate-mr-pulse rounded-mr-xs bg-mr-gray-800" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-[76px] animate-mr-pulse rounded-mr-md bg-mr-gray-800" />
                    ))}
                </div>
                <div className="mt-4 h-28 animate-mr-pulse rounded-mr-md bg-mr-gray-800" />
                <div className="mt-7 grid gap-4 lg:grid-cols-2">
                    <div className="h-44 animate-mr-pulse rounded-mr-md bg-mr-gray-800" />
                    <div className="h-44 animate-mr-pulse rounded-mr-md bg-mr-gray-800" />
                </div>
            </div>
        );
    }

    if (isError || !metrics) {
        return (
            <div className="flex flex-col items-center px-5 py-12 text-center">
                <Illustration type="zangada" className="mb-3.5 size-24 object-contain" />
                <p className="mb-4 text-mr-small text-mr-fg-subtle">{t('dashboard.overview.errorMetrics')}</p>
                <Button variant="raised" size="sm" onClick={() => refetch()}>
                    {t('common.retry')}
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="mb-5">
                <h1 className="text-[26px] font-mr-extrabold leading-tight text-mr-fg md:text-[30px]">{t('dashboard.overview.title')}</h1>
                <p className="mt-1.5 text-mr-small text-mr-fg-subtle">{t('dashboard.overview.subtitle')}</p>
            </div>

            <AdminDashboardOverview metrics={metrics} />

            <h2 className="mt-7 mb-3.5 text-[18px] font-mr-bold tracking-mr text-mr-fg">{t('dashboard.overview.contentSection')}</h2>
            {isLoadingContent ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="h-44 animate-mr-pulse rounded-mr-md bg-mr-gray-800" />
                    <div className="h-44 animate-mr-pulse rounded-mr-md bg-mr-gray-800" />
                </div>
            ) : isErrorContent || !contentMetrics ? (
                <p className="text-mr-small text-mr-fg-subtle">{t('dashboard.overview.errorContentMetrics')}</p>
            ) : (
                <ContentMetricsPanel metrics={contentMetrics} />
            )}
        </div>
    );
};

export default DashboardOverview;
