import { useTranslation } from 'react-i18next';

import AdminDashboardOverview from '@feature/admin/component/AdminDashboardOverview';
import ContentMetricsPanel from '@feature/admin/component/ContentMetricsPanel';
import useContentMetrics from '@feature/admin/hook/useContentMetrics';
import useDashboardMetrics from '@feature/admin/hook/useDashboardMetrics';

const DashboardOverview = () => {
    const { t } = useTranslation('admin');
    const { metrics, isLoading, isError, refetch } = useDashboardMetrics();
    const {
        metrics: contentMetrics,
        isLoading: isLoadingContent,
        isError: isErrorContent,
    } = useContentMetrics();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                <div className="h-8 rounded-xs bg-tertiary/30 animate-pulse w-48" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-24 rounded-xs bg-tertiary/30 animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (isError || !metrics) {
        return (
            <div className="py-8 text-center">
                <p className="mb-2 text-sm text-tertiary">
                    {t('dashboard.overview.errorMetrics')}
                </p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 text-sm border rounded-xs border-tertiary hover:bg-tertiary/30"
                >
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-lg font-bold">
                {t('dashboard.overview.title')}
            </h1>
            <AdminDashboardOverview metrics={metrics} />

            <h2 className="mt-2 text-base font-bold">
                {t('dashboard.overview.contentSection')}
            </h2>
            {isLoadingContent ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="h-48 rounded-xs bg-tertiary/30 animate-pulse" />
                    <div className="h-48 rounded-xs bg-tertiary/30 animate-pulse" />
                </div>
            ) : isErrorContent || !contentMetrics ? (
                <p className="text-sm text-tertiary">
                    {t('dashboard.overview.errorContentMetrics')}
                </p>
            ) : (
                <ContentMetricsPanel metrics={contentMetrics} />
            )}
        </div>
    );
};

export default DashboardOverview;
