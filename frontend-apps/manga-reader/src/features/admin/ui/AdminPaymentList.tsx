import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import DataTable, { type Column } from '@shared/component/table/DataTable';
import useSortableData from '@shared/hook/useSortableData';

import type { AdminPayment } from '../model/admin.types';
import { getLocale } from '@shared/lib/formatters';
import { Pencil, Trash2 } from 'lucide-react';

type AdminPaymentListProps = {
    payments: AdminPayment[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (payment: AdminPayment) => void;
    onDelete: (payment: AdminPayment) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat(getLocale(), {
        style: 'currency',
        currency: currency || 'BRL',
    }).format(amount);

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-300',
    COMPLETED: 'bg-green-500/20 text-green-300',
    FAILED: 'bg-red-500/20 text-red-300',
    REFUNDED: 'bg-blue-500/20 text-blue-300',
};

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${STATUS_COLORS[status] ?? 'bg-tertiary/30'}`}>{status}</span>
);

const buildColumns = (t: TFunction, onEdit: (payment: AdminPayment) => void, onDelete: (payment: AdminPayment) => void): Column<AdminPayment>[] => [
    {
        key: 'id',
        header: t('dashboard.financial.columnId'),
        hiddenOnMobile: true,
        render: payment => <span className="font-mono text-xs text-tertiary">{payment.id.slice(0, 8)}</span>,
    },
    {
        key: 'amount',
        header: t('dashboard.financial.columnAmount'),
        sortable: true,
        render: payment => <span className="font-medium">{formatAmount(payment.amount, payment.currency)}</span>,
    },
    {
        key: 'status',
        header: t('dashboard.financial.columnStatus'),
        sortable: true,
        render: payment => <StatusBadge status={payment.status} />,
    },
    {
        key: 'paymentMethod',
        header: t('dashboard.financial.columnMethod'),
        hiddenOnMobile: true,
        sortable: true,
        render: payment => <span className="text-xs text-tertiary">{payment.paymentMethod ?? '—'}</span>,
    },
    {
        key: 'referenceType',
        header: t('dashboard.financial.columnReference'),
        hiddenOnMobile: true,
        render: payment => <span className="text-xs text-tertiary">{payment.referenceType ?? '—'}</span>,
    },
    {
        key: 'createdAt',
        header: t('dashboard.financial.columnCreatedAt'),
        sortable: true,
        render: payment => <span className="text-xs text-tertiary">{formatDate(payment.createdAt)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.financial.columnActions'),
        render: payment => (
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onEdit(payment);
                    }}
                    className="p-1.5 border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                    aria-label={t('dashboard.financial.editAriaLabel')}
                >
                    <Pencil size={14} />
                </button>
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onDelete(payment);
                    }}
                    className="p-1.5 border rounded-xs border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label={t('dashboard.financial.deleteAriaLabel')}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        ),
    },
];

const AdminPaymentList = ({ payments, page, totalPages, isLoading, onPageChange, onEdit, onDelete }: AdminPaymentListProps) => {
    const { t } = useTranslation('admin');
    const { sortedData, sortBy, sortDirection, handleSort } = useSortableData(payments);

    return (
        <DataTable
            columns={buildColumns(t, onEdit, onDelete)}
            data={sortedData}
            keyExtractor={payment => payment.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage={t('dashboard.financial.empty')}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminPaymentList;
