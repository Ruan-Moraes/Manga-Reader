import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    AdminPaymentList,
    RevenueChart,
    RevenueKPICards,
    FinancialDashboard,
    UpdatePaymentStatusModal,
    ConfirmDeleteWithIdModal,
    useAdminPaymentActions,
    useAdminPayments,
    useFinancialSummary,
    useRevenueSeries,
    type AdminPayment,
} from '@feature/admin';
import { Select } from '@ui/Select';

const STATUS_OPTIONS = ['', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] as const;

const DashboardFinancial = () => {
    const { t } = useTranslation('admin');

    const statusLabels = useMemo<Record<string, string>>(
        () => ({
            '': t('dashboard.financial.statusAll'),
        }),
        [t],
    );

    const { payments, page, totalPages, totalElements, isLoading, statusFilter, setStatusFilter, setPage } = useAdminPayments();

    const { summary, isLoading: isLoadingSummary, isError: isErrorSummary } = useFinancialSummary();

    const { isSubmitting, handleUpdateStatus } = useAdminPaymentActions();

    const { data: revenueSeries, isLoading: isLoadingRevenue } = useRevenueSeries(12);

    const [editingPayment, setEditingPayment] = useState<AdminPayment | null>(null);
    const [deletingPayment, setDeletingPayment] = useState<AdminPayment | null>(null);

    const confirmUpdate = async (status: string) => {
        if (editingPayment) {
            await handleUpdateStatus(editingPayment.id, status);
            setEditingPayment(null);
        }
    };

    const confirmDelete = async () => {
        if (deletingPayment) {
            await handleUpdateStatus(deletingPayment.id, 'FAILED');
            setDeletingPayment(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-lg font-bold">{t('dashboard.financial.title')}</h1>

            {isLoadingSummary ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xs bg-tertiary/30 animate-pulse" />
                    ))}
                </div>
            ) : isErrorSummary || !summary ? (
                <p className="text-sm text-tertiary">{t('dashboard.financial.errorSummary')}</p>
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
                <h2 className="text-base font-bold">{t('dashboard.financial.payments')}</h2>
                <span className="text-sm text-tertiary">{t('dashboard.financial.count', { count: totalElements })}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-tertiary">{t('dashboard.financial.statusLabel')}</span>
                <div className="min-w-[10rem]">
                    <Select
                        value={statusFilter}
                        onChange={e => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                        }}
                        options={STATUS_OPTIONS.map(option => ({
                            value: option,
                            label: statusLabels[option] ?? option,
                        }))}
                    />
                </div>
            </div>

            <AdminPaymentList
                payments={payments}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={setEditingPayment}
                onDelete={setDeletingPayment}
            />

            <UpdatePaymentStatusModal
                isOpen={editingPayment !== null}
                onClose={() => setEditingPayment(null)}
                onConfirm={confirmUpdate}
                paymentId={editingPayment?.id ?? ''}
                currentStatus={editingPayment?.status ?? 'PENDING'}
                isSubmitting={isSubmitting}
            />

            <ConfirmDeleteWithIdModal
                isOpen={deletingPayment !== null}
                onClose={() => setDeletingPayment(null)}
                onConfirm={confirmDelete}
                entityId={deletingPayment?.id ?? ''}
                title={t('dashboard.financial.deleteTitle')}
                message={t('dashboard.financial.deleteConfirm')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardFinancial;
