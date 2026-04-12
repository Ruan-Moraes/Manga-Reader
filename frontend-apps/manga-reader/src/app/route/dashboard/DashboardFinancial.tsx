import { useState } from 'react';

import AdminPaymentList from '@feature/admin/component/AdminPaymentList';
import RevenueChart from '@feature/admin/component/chart/RevenueChart';
import RevenueKPICards from '@feature/admin/component/chart/RevenueKPICards';
import FinancialDashboard from '@feature/admin/component/FinancialDashboard';
import UpdatePaymentStatusModal from '@feature/admin/component/modal/UpdatePaymentStatusModal';
import useAdminPaymentActions from '@feature/admin/hook/useAdminPaymentActions';
import useAdminPayments from '@feature/admin/hook/useAdminPayments';
import useFinancialSummary from '@feature/admin/hook/useFinancialSummary';
import useRevenueSeries from '@feature/admin/hook/useRevenueSeries';
import type { AdminPayment } from '@feature/admin/type/admin.types';

const STATUS_OPTIONS = [
    '',
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
] as const;

const DashboardFinancial = () => {
    const {
        payments,
        page,
        totalPages,
        totalElements,
        isLoading,
        statusFilter,
        setStatusFilter,
        setPage,
    } = useAdminPayments();

    const {
        summary,
        isLoading: isLoadingSummary,
        isError: isErrorSummary,
    } = useFinancialSummary();

    const { isSubmitting, handleUpdateStatus } = useAdminPaymentActions();

    const { data: revenueSeries, isLoading: isLoadingRevenue } =
        useRevenueSeries(12);

    const [editingPayment, setEditingPayment] = useState<AdminPayment | null>(
        null,
    );

    const confirmUpdate = async (status: string) => {
        if (editingPayment) {
            await handleUpdateStatus(editingPayment.id, status);
            setEditingPayment(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-lg font-bold">Financeiro</h1>

            {isLoadingSummary ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-24 rounded-xs bg-tertiary/30 animate-pulse"
                        />
                    ))}
                </div>
            ) : isErrorSummary || !summary ? (
                <p className="text-sm text-tertiary">
                    Erro ao carregar resumo financeiro.
                </p>
            ) : (
                <FinancialDashboard summary={summary} />
            )}

            {isLoadingRevenue ? (
                <div className="h-64 rounded-xs bg-tertiary/30 animate-pulse" />
            ) : revenueSeries ? (
                <>
                    <RevenueKPICards data={revenueSeries} />
                    <RevenueChart entries={revenueSeries.entries} />
                </>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                <h2 className="text-base font-bold">Pagamentos</h2>
                <span className="text-sm text-tertiary">
                    {totalElements} pagamentos
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm text-tertiary">Status:</label>
                <select
                    value={statusFilter}
                    onChange={e => {
                        setStatusFilter(e.target.value);
                        setPage(0);
                    }}
                    className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                >
                    {STATUS_OPTIONS.map(option => (
                        <option key={option || 'all'} value={option}>
                            {option || 'Todos'}
                        </option>
                    ))}
                </select>
            </div>

            <AdminPaymentList
                payments={payments}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onRowClick={setEditingPayment}
            />

            <UpdatePaymentStatusModal
                isOpen={editingPayment !== null}
                onClose={() => setEditingPayment(null)}
                onConfirm={confirmUpdate}
                paymentId={editingPayment?.id ?? ''}
                currentStatus={editingPayment?.status ?? 'PENDING'}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardFinancial;
