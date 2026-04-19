import DataTable, { type Column } from '@shared/component/table/DataTable';
import useSortableData from '@shared/hook/useSortableData';

import type { AdminPayment } from '../type/admin.types';

type AdminPaymentListProps = {
    payments: AdminPayment[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onRowClick: (payment: AdminPayment) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('pt-BR', {
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
    <span
        className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${
            STATUS_COLORS[status] ?? 'bg-tertiary/30'
        }`}
    >
        {status}
    </span>
);

const columns: Column<AdminPayment>[] = [
    {
        key: 'id',
        header: 'ID',
        hiddenOnMobile: true,
        render: payment => (
            <span className="font-mono text-xs text-tertiary">
                {payment.id.slice(0, 8)}
            </span>
        ),
    },
    {
        key: 'amount',
        header: 'Valor',
        sortable: true,
        render: payment => (
            <span className="font-medium">
                {formatAmount(payment.amount, payment.currency)}
            </span>
        ),
    },
    {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: payment => <StatusBadge status={payment.status} />,
    },
    {
        key: 'paymentMethod',
        header: 'Método',
        hiddenOnMobile: true,
        sortable: true,
        render: payment => (
            <span className="text-xs text-tertiary">
                {payment.paymentMethod ?? '—'}
            </span>
        ),
    },
    {
        key: 'referenceType',
        header: 'Referência',
        hiddenOnMobile: true,
        render: payment => (
            <span className="text-xs text-tertiary">
                {payment.referenceType ?? '—'}
            </span>
        ),
    },
    {
        key: 'createdAt',
        header: 'Criado em',
        sortable: true,
        render: payment => (
            <span className="text-xs text-tertiary">
                {formatDate(payment.createdAt)}
            </span>
        ),
    },
];

const AdminPaymentList = ({
    payments,
    page,
    totalPages,
    isLoading,
    onPageChange,
    onRowClick,
}: AdminPaymentListProps) => {
    const { sortedData, sortBy, sortDirection, handleSort } =
        useSortableData(payments);

    return (
        <DataTable
            columns={columns}
            data={sortedData}
            keyExtractor={payment => payment.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage="Nenhum pagamento encontrado."
            onRowClick={onRowClick}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminPaymentList;
