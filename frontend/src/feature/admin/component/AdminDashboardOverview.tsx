import { FiUsers, FiBook, FiLayers, FiFileText, FiCalendar, FiAlertCircle } from 'react-icons/fi';

import type { DashboardMetrics } from '../type/admin.types';

type MetricCardProps = {
    label: string;
    value: number;
    icon: React.ReactNode;
};

const MetricCard = ({ label, value, icon }: MetricCardProps) => (
    <div className="flex items-center gap-3 p-4 border rounded-xs bg-secondary border-tertiary">
        <div className="p-2 rounded-xs bg-quaternary-opacity-25">{icon}</div>
        <div>
            <p className="text-2xl font-bold">{value.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-tertiary">{label}</p>
        </div>
    </div>
);

type AdminDashboardOverviewProps = {
    metrics: DashboardMetrics;
};

const AdminDashboardOverview = ({ metrics }: AdminDashboardOverviewProps) => {
    const cards: MetricCardProps[] = [
        { label: 'Usuários', value: metrics.totalUsers, icon: <FiUsers size={20} /> },
        { label: 'Obras', value: metrics.totalTitles, icon: <FiBook size={20} /> },
        { label: 'Grupos', value: metrics.totalGroups, icon: <FiLayers size={20} /> },
        { label: 'Notícias', value: metrics.totalNews, icon: <FiFileText size={20} /> },
        { label: 'Eventos', value: metrics.totalEvents, icon: <FiCalendar size={20} /> },
        { label: 'Banidos', value: metrics.bannedUsers, icon: <FiAlertCircle size={20} /> },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map(card => (
                    <MetricCard key={card.label} {...card} />
                ))}
            </div>

            <div className="p-4 border rounded-xs bg-secondary border-tertiary">
                <h3 className="mb-3 text-sm font-semibold">Distribuição por Role</h3>
                <div className="flex flex-wrap gap-4">
                    {Object.entries(metrics.usersByRole).map(([role, count]) => (
                        <div key={role} className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-quaternary-opacity-25">
                                {role}
                            </span>
                            <span>{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardOverview;
