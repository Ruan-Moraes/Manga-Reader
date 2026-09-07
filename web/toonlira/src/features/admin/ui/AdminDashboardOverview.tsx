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
                'flex items-center gap-3.5 rounded-ui-md border border-ui-border bg-ui-surface p-4 text-left transition-all duration-ui-default',
                clickable
                    ? 'cursor-pointer hover:-translate-y-px hover:border-ui-accent-50 hover:shadow-ui-elevated'
                    : 'cursor-default',
            )}
        >
            <span
                className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-ui-sm',
                    kpi.danger ? 'bg-ui-danger-15 text-ui-danger' : 'bg-ui-accent-25 text-ui-accent-fg',
                )}
            >
                {kpi.icon}
            </span>
            <span className="min-w-0">
                <span className={cn('block text-[28px] font-ui-extrabold leading-none', kpi.danger ? 'text-ui-danger' : 'text-ui-fg')}>
                    {kpi.value.toLocaleString(getLocale())}
                </span>
                <span className="mt-1.5 block text-ui-small font-ui-semibold uppercase tracking-[0.08em] text-ui-fg-subtle">{kpi.label}</span>
            </span>
        </button>
    );
};

const ROLE_FILL: Record<string, string> = {
    ADMIN: 'bg-ui-danger',
    MODERATOR: 'bg-ui-accent',
    MEMBER: 'bg-ui-gray-400',
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

            <div className="rounded-ui-md border border-ui-border bg-ui-surface p-[18px]">
                <div className="mb-4 flex items-center justify-between gap-2.5">
                    <h3 className="text-[15px] font-ui-bold text-ui-fg">{t('dashboard.overview.metrics.roleDistribution')}</h3>
                    <span className="text-ui-small text-ui-fg-subtle">{t('dashboard.overview.metrics.usersTotal', { count: totalByRole })}</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-ui-full bg-ui-gray-900">
                    {roleEntries.map(([role, count]) => (
                        <span
                            key={role}
                            className={cn('h-full transition-all duration-ui-slow', ROLE_FILL[role] ?? 'bg-ui-gray-400')}
                            style={{ width: totalByRole ? `${(count / totalByRole) * 100}%` : '0%' }}
                        />
                    ))}
                </div>
                <div className="mt-3.5 flex flex-wrap gap-x-[18px] gap-y-2">
                    {roleEntries.map(([role, count]) => (
                        <span key={role} className="flex items-center gap-2 text-ui-small">
                            <span className={cn('size-[9px] shrink-0 rounded-ui-xs', ROLE_FILL[role] ?? 'bg-ui-gray-400')} />
                            <span className="text-ui-fg-muted">{t(`dashboard.overview.roles.${role}`, { defaultValue: role })}</span>
                            <b className="font-ui-extrabold text-ui-fg tabular-nums">{count}</b>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardOverview;
