import { useTranslation } from 'react-i18next';

import type { FinancialSummary } from '../model/admin.types';
import { PAYMENT_STATUS_TONE, statusLabelKey, toneFor } from '../model/statusTone';
import MetricsCard from './MetricsCard';
import { StatusPill } from '@ui/StatusPill';
import { getLocale } from '@shared/lib/formatters';

type FinancialDashboardProps = {
    summary: FinancialSummary;
};

const formatCurrency = (value: number) => new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'BRL' }).format(value ?? 0);

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

            <div className="rounded-mr-md border border-mr-border bg-mr-surface p-[18px]">
                <h3 className="mb-3 text-[15px] font-mr-bold text-mr-fg">{t('dashboard.financial.summary.distributionByStatus')}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-mr-small">
                        <thead>
                            <tr className="border-b border-mr-border">
                                <th className="py-2 text-left text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-fg-subtle">{t('dashboard.financial.columnStatus')}</th>
                                <th className="py-2 text-right text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-fg-subtle">{t('dashboard.financial.summary.quantity')}</th>
                                <th className="py-2 text-right text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-fg-subtle">{t('dashboard.financial.summary.totalAmount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statuses.map(status => (
                                <tr key={status} className="border-b border-mr-gray-900 last:border-b-0">
                                    <td className="py-2.5">
                                        <StatusPill tone={toneFor(PAYMENT_STATUS_TONE, status)}>{t(statusLabelKey('payment', status), { defaultValue: status })}</StatusPill>
                                    </td>
                                    <td className="py-2.5 text-right tabular-nums text-mr-fg">{summary.countsByStatus[status] ?? 0}</td>
                                    <td className="py-2.5 text-right tabular-nums text-mr-fg-subtle">{formatCurrency(summary.amountsByStatus[status] ?? 0)}</td>
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
