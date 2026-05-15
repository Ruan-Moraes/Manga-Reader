import {
    FiUsers,
    FiBook,
    FiLayers,
    FiFileText,
    FiCalendar,
    FiAlertCircle,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

import type { DashboardMetrics } from '@feature/admin';
import { getLocale } from '@shared/util/formatters';

type MetricCardProps = {
    label: string;
    value: number;
    icon: React.ReactNode;
};

type AdminDashboardOverviewProps = {
    metrics: DashboardMetrics;
};

const MetricCard = ({ label, value, icon }: MetricCardProps) => (
    <div className="flex items-center gap-3 p-4 border rounded-xs bg-secondary border-tertiary">
        <div className="p-2 rounded-xs bg-quaternary-opacity-25">{icon}</div>
        <div>
            <p className="text-2xl font-bold">
                {value.toLocaleString(getLocale())}
            </p>
            <p className="text-xs text-tertiary">{label}</p>
        </div>
    </div>
);

const AdminDashboardOverview = ({ metrics }: AdminDashboardOverviewProps) => {
    const { t } = useTranslation('admin');

    const cards: MetricCardProps[] = [
        {
            label: t('dashboard.overview.metrics.users'),
            value: metrics.totalUsers,
            icon: <FiUsers size={20} />,
        },
        {
            label: t('dashboard.overview.metrics.titles'),
            value: metrics.totalTitles,
            icon: <FiBook size={20} />,
        },
        {
            label: t('dashboard.overview.metrics.groups'),
            value: metrics.totalGroups,
            icon: <FiLayers size={20} />,
        },
        {
            label: t('dashboard.overview.metrics.news'),
            value: metrics.totalNews,
            icon: <FiFileText size={20} />,
        },
        {
            label: t('dashboard.overview.metrics.events'),
            value: metrics.totalEvents,
            icon: <FiCalendar size={20} />,
        },
        {
            label: t('dashboard.overview.metrics.banned'),
            value: metrics.bannedUsers,
            icon: <FiAlertCircle size={20} />,
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map(card => (
                    <MetricCard key={card.label} {...card} />
                ))}
            </div>

            <div className="p-4 border rounded-xs bg-secondary border-tertiary">
                <h3 className="mb-3 text-sm font-semibold">
                    {t('dashboard.overview.metrics.roleDistribution')}
                </h3>
                <div className="flex flex-wrap gap-4">
                    {Object.entries(metrics.usersByRole).map(
                        ([role, count]) => (
                            <div
                                key={role}
                                className="flex items-center gap-2 text-sm"
                            >
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-quaternary-opacity-25">
                                    {role}
                                </span>
                                <span>{count}</span>
                            </div>
                        ),
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardOverview;
