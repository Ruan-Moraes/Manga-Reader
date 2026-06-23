import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import DataTable, { type Column } from '@ui/DataTable';
import { StatusPill } from '@ui/StatusPill';
import useSortableData from '@shared/hook/useSortableData';
import { getLocale } from '@shared/lib/formatters';

import type { AdminPayment } from '../model/admin.types';
import { PAYMENT_STATUS_TONE, statusLabelKey, toneFor } from '../model/statusTone';
import RowActions from './parts/RowActions';

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
    return new Date(date).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat(getLocale(), { style: 'currency', currency: currency || 'BRL' }).format(amount);

const buildColumns = (t: TFunction, onEdit: (payment: AdminPayment) => void, onDelete: (payment: AdminPayment) => void): Column<AdminPayment>[] => [
    {
        key: 'id',
        header: t('dashboard.financial.columnId'),
        hideBelow: 'md',
        render: payment => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{payment.id.slice(0, 8)}</span>,
    },
    {
        key: 'amount',
        header: t('dashboard.financial.columnAmount'),
        sortable: true,
        render: payment => <span className="font-mr-bold tabular-nums text-mr-fg">{formatAmount(payment.amount, payment.currency)}</span>,
    },
    {
        key: 'status',
        header: t('dashboard.financial.columnStatus'),
        sortable: true,
        render: payment => <StatusPill tone={toneFor(PAYMENT_STATUS_TONE, payment.status)}>{t(statusLabelKey('payment', payment.status), { defaultValue: payment.status })}</StatusPill>,
    },
    {
        key: 'paymentMethod',
        header: t('dashboard.financial.columnMethod'),
        hideBelow: 'md',
        sortable: true,
        render: payment => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{payment.paymentMethod ?? '—'}</span>,
    },
    {
        key: 'referenceType',
        header: t('dashboard.financial.columnReference'),
        hideBelow: 'md',
        render: payment => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{payment.referenceType ?? '—'}</span>,
    },
    {
        key: 'createdAt',
        header: t('dashboard.financial.columnCreatedAt'),
        sortable: true,
        hideBelow: 'sm',
        render: payment => <span className="text-mr-fg-subtle">{formatDate(payment.createdAt)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.financial.columnActions'),
        align: 'right',
        render: payment => (
            <RowActions
                onEdit={() => onEdit(payment)}
                onDelete={() => onDelete(payment)}
                editLabel={t('dashboard.financial.editAriaLabel')}
                deleteLabel={t('dashboard.financial.deleteAriaLabel')}
            />
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
