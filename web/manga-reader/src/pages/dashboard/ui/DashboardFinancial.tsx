import { useState } from 'react';
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
} from '@features/admin';
import { Select } from '@ui/Select';

const STATUS_OPTIONS = ['', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] as const;

const DashboardFinancial = () => {
    const { t } = useTranslation('admin');

    const statusLabel = (option: string) => (option ? t(`dashboard.status.payment.${option}`, { defaultValue: option }) : t('dashboard.financial.statusAll'));

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
            <div>
                <h1 className="text-[26px] font-mr-extrabold leading-tight text-mr-fg md:text-[30px]">{t('dashboard.financial.title')}</h1>
                <p className="mt-1.5 text-mr-small text-mr-fg-subtle">{t('dashboard.financial.subtitle')}</p>
            </div>

            {isLoadingSummary ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 animate-mr-pulse rounded-mr-md bg-mr-gray-800" />
                    ))}
                </div>
            ) : isErrorSummary || !summary ? (
                <p className="text-mr-small text-mr-fg-subtle">{t('dashboard.financial.errorSummary')}</p>
            ) : (
                <FinancialDashboard summary={summary} />
            )}

            {isLoadingRevenue ? (
                <div className="h-64 animate-mr-pulse rounded-mr-md bg-mr-gray-800" />
            ) : revenueSeries ? (
                <>
                    <RevenueKPICards data={revenueSeries} />
                    <RevenueChart entries={revenueSeries.entries} />
                </>
            ) : null}

            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-[18px] font-mr-bold tracking-mr text-mr-fg">{t('dashboard.financial.payments')}</h2>
                <span className="text-mr-small text-mr-fg-subtle">{t('dashboard.financial.count', { count: totalElements })}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-mr-small font-mr-bold text-mr-fg-subtle">{t('dashboard.financial.statusLabel')}</span>
                <div className="min-w-[10rem]">
                    <Select
                        value={statusFilter}
                        onChange={e => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                        }}
                        options={STATUS_OPTIONS.map(option => ({ value: option, label: statusLabel(option) }))}
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
