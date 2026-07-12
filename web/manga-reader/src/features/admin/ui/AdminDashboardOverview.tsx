import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Book, Calendar, FileText, Layers, Users } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import { withWebBasePath } from '@shared/constant/WEB_BASE_URL';
import { getLocale } from '@shared/lib/formatters';
import { cn } from '@shared/lib/cn';

import type { DashboardMetrics } from '../model/admin.types';

type AdminDashboardOverviewProps = {
    metrics: DashboardMetrics;
};

type Kpi = {
    label: string;
    value: number;
    icon: React.ReactNode;
    to?: string;
    danger?: boolean;
};

const KpiCard = ({ kpi }: { kpi: Kpi }) => {
    const navigate = useNavigate();
    const clickable = Boolean(kpi.to);

    return (
        <button
            type="button"
            disabled={!clickable}
            onClick={() => kpi.to && navigate(kpi.to)}
            className={cn(
                'flex items-center gap-3.5 rounded-mr-md border border-mr-border bg-mr-surface p-4 text-left transition-all duration-mr-default',
                clickable
                    ? 'cursor-pointer hover:-translate-y-px hover:border-mr-accent-50 hover:shadow-mr-elevated'
                    : 'cursor-default',
            )}
        >
            <span
                className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-mr-sm',
                    kpi.danger ? 'bg-mr-danger-15 text-mr-danger' : 'bg-mr-accent-25 text-mr-accent',
                )}
            >
                {kpi.icon}
            </span>
            <span className="min-w-0">
                <span className={cn('block text-[28px] font-mr-extrabold leading-none', kpi.danger ? 'text-mr-danger' : 'text-mr-fg')}>
                    {kpi.value.toLocaleString(getLocale())}
                </span>
                <span className="mt-1.5 block text-mr-small font-mr-semibold uppercase tracking-[0.08em] text-mr-fg-subtle">{kpi.label}</span>
            </span>
        </button>
    );
};

const ROLE_FILL: Record<string, string> = {
    ADMIN: 'bg-mr-danger',
    MODERATOR: 'bg-mr-accent',
    MEMBER: 'bg-mr-gray-400',
};

const AdminDashboardOverview = ({ metrics }: AdminDashboardOverviewProps) => {
    const { t } = useTranslation('admin');

    const kpis: Kpi[] = [
        { label: t('dashboard.overview.metrics.users'), value: metrics.totalUsers, icon: <Users size={22} />, to: withWebBasePath(ROUTES.DASHBOARD_USERS) },
        { label: t('dashboard.overview.metrics.titles'), value: metrics.totalTitles, icon: <Book size={22} />, to: withWebBasePath(ROUTES.DASHBOARD_TITLES) },
        { label: t('dashboard.overview.metrics.groups'), value: metrics.totalGroups, icon: <Layers size={22} />, to: withWebBasePath(ROUTES.DASHBOARD_GROUPS) },
        { label: t('dashboard.overview.metrics.news'), value: metrics.totalNews, icon: <FileText size={22} />, to: withWebBasePath(ROUTES.DASHBOARD_NEWS) },
        { label: t('dashboard.overview.metrics.events'), value: metrics.totalEvents, icon: <Calendar size={22} />, to: withWebBasePath(ROUTES.DASHBOARD_EVENTS) },
        { label: t('dashboard.overview.metrics.banned'), value: metrics.bannedUsers, icon: <AlertCircle size={22} />, to: withWebBasePath(ROUTES.DASHBOARD_USERS), danger: true },
    ];

    const roleEntries = Object.entries(metrics.usersByRole);
    const totalByRole = roleEntries.reduce((acc, [, count]) => acc + count, 0);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {kpis.map(kpi => (
                    <KpiCard key={kpi.label} kpi={kpi} />
                ))}
            </div>

            <div className="rounded-mr-md border border-mr-border bg-mr-surface p-[18px]">
                <div className="mb-4 flex items-center justify-between gap-2.5">
                    <h3 className="text-[15px] font-mr-bold text-mr-fg">{t('dashboard.overview.metrics.roleDistribution')}</h3>
                    <span className="text-mr-small text-mr-fg-subtle">{t('dashboard.overview.metrics.usersTotal', { count: totalByRole })}</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-mr-full bg-mr-gray-900">
                    {roleEntries.map(([role, count]) => (
                        <span
                            key={role}
                            className={cn('h-full transition-all duration-mr-slow', ROLE_FILL[role] ?? 'bg-mr-gray-400')}
                            style={{ width: totalByRole ? `${(count / totalByRole) * 100}%` : '0%' }}
                        />
                    ))}
                </div>
                <div className="mt-3.5 flex flex-wrap gap-x-[18px] gap-y-2">
                    {roleEntries.map(([role, count]) => (
                        <span key={role} className="flex items-center gap-2 text-mr-small">
                            <span className={cn('size-[9px] shrink-0 rounded-mr-xs', ROLE_FILL[role] ?? 'bg-mr-gray-400')} />
                            <span className="text-mr-fg-muted">{t(`dashboard.overview.roles.${role}`, { defaultValue: role })}</span>
                            <b className="font-mr-extrabold text-mr-fg tabular-nums">{count}</b>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardOverview;
