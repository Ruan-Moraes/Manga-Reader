import { useTranslation } from 'react-i18next';

import type { FinancialSummary } from '../type/admin.types';
import MetricsCard from './MetricsCard';
import { getLocale } from '@shared/util/formatters';

type FinancialDashboardProps = {
    summary: FinancialSummary;
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat(getLocale(), {
        style: 'currency',
        currency: 'BRL',
    }).format(value ?? 0);

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-300',
    COMPLETED: 'bg-green-500/20 text-green-300',
    FAILED: 'bg-red-500/20 text-red-300',
    REFUNDED: 'bg-blue-500/20 text-blue-300',
};

const FinancialDashboard = ({ summary }: FinancialDashboardProps) => {
    const { t } = useTranslation('admin');
    const statuses = Object.keys(summary.countsByStatus);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricsCard label={t('dashboard.financial.summary.totalPayments')} value={summary.totalPayments} />
                <MetricsCard label={t('dashboard.financial.summary.confirmedRevenue')} value={formatCurrency(summary.totalRevenue)} accent="success" />
                <MetricsCard label={t('dashboard.financial.summary.pendingRevenue')} value={formatCurrency(summary.pendingRevenue)} accent="warning" />
            </div>

            <div className="p-4 border rounded-xs bg-secondary border-tertiary">
                <h3 className="mb-3 text-sm font-semibold">{t('dashboard.financial.summary.distributionByStatus')}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-tertiary">
                                <th className="py-2 text-left font-medium text-tertiary">{t('dashboard.financial.columnStatus')}</th>
                                <th className="py-2 text-right font-medium text-tertiary">{t('dashboard.financial.summary.quantity')}</th>
                                <th className="py-2 text-right font-medium text-tertiary">{t('dashboard.financial.summary.totalAmount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statuses.map(status => (
                                <tr key={status} className="border-b border-tertiary/30">
                                    <td className="py-2">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${STATUS_COLORS[status] ?? 'bg-tertiary/30'}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="py-2 text-right">{summary.countsByStatus[status] ?? 0}</td>
                                    <td className="py-2 text-right text-xs text-tertiary">{formatCurrency(summary.amountsByStatus[status] ?? 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialDashboard;
