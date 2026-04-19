import DataTable, { type Column } from '@shared/component/table/DataTable';
import useSortableData from '@shared/hook/useSortableData';

import type { AdminSubscription } from '../type/admin.types';

type AdminSubscriptionListProps = {
    subscriptions: AdminSubscription[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onRowClick: (subscription: AdminSubscription) => void;
};

const PERIOD_LABELS: Record<string, string> = {
    DAILY: 'Diário',
    MONTHLY: 'Mensal',
    ANNUAL: 'Anual',
};

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-300',
    EXPIRED: 'bg-yellow-500/20 text-yellow-300',
    CANCELLED: 'bg-red-500/20 text-red-300',
};

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Ativa',
    EXPIRED: 'Expirada',
    CANCELLED: 'Cancelada',
};

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

const formatPrice = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

const StatusBadge = ({ status }: { status: string }) => (
    <span
        className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${
            STATUS_COLORS[status] ?? 'bg-tertiary/30'
        }`}
    >
        {STATUS_LABELS[status] ?? status}
    </span>
);

const columns: Column<AdminSubscription>[] = [
    {
        key: 'id',
        header: 'ID',
        hiddenOnMobile: true,
        render: sub => (
            <span className="font-mono text-xs text-tertiary">
                {sub.id.slice(0, 8)}
            </span>
        ),
    },
    {
        key: 'userId',
        header: 'Usuário',
        hiddenOnMobile: true,
        render: sub => (
            <span className="font-mono text-xs text-tertiary">
                {sub.userId.slice(0, 8)}
            </span>
        ),
    },
    {
        key: 'planPeriod',
        header: 'Plano',
        sortable: true,
        render: sub => (
            <div className="flex flex-col">
                <span className="font-medium">
                    {PERIOD_LABELS[sub.planPeriod] ?? sub.planPeriod}
                </span>
                <span className="text-xs text-tertiary">
                    {formatPrice(sub.planPriceInCents)}
                </span>
            </div>
        ),
    },
    {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: sub => <StatusBadge status={sub.status} />,
    },
    {
        key: 'startDate',
        header: 'Início',
        sortable: true,
        render: sub => (
            <span className="text-xs">{formatDate(sub.startDate)}</span>
        ),
    },
    {
        key: 'endDate',
        header: 'Fim',
        hiddenOnMobile: true,
        sortable: true,
        render: sub => (
            <span className="text-xs">{formatDate(sub.endDate)}</span>
        ),
    },
];

const AdminSubscriptionList = ({
    subscriptions,
    page,
    totalPages,
    isLoading,
    onPageChange,
    onRowClick,
}: AdminSubscriptionListProps) => {
    const { sortedData, sortBy, sortDirection, handleSort } =
        useSortableData(subscriptions);

    return (
        <DataTable
            columns={columns}
            data={sortedData}
            keyExtractor={sub => sub.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage="Nenhuma assinatura encontrada."
            onRowClick={onRowClick}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminSubscriptionList;
