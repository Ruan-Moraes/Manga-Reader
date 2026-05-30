import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import DataTable, { type Column } from '@shared/component/table/DataTable';
import useSortableData from '@shared/hook/useSortableData';

import type { AdminSubscription } from '../model/admin.types';
import { getLocale } from '@shared/util/formatters';
import { Pencil, Trash2 } from 'lucide-react';

type AdminSubscriptionListProps = {
    subscriptions: AdminSubscription[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (subscription: AdminSubscription) => void;
    onDelete: (subscription: AdminSubscription) => void;
};

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-300',
    EXPIRED: 'bg-yellow-500/20 text-yellow-300',
    CANCELLED: 'bg-red-500/20 text-red-300',
};

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(getLocale(), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

const formatPrice = (cents: number) =>
    (cents / 100).toLocaleString(getLocale(), {
        style: 'currency',
        currency: 'BRL',
    });

const buildColumns = (t: TFunction, onEdit: (sub: AdminSubscription) => void, onDelete: (sub: AdminSubscription) => void): Column<AdminSubscription>[] => {
    const periodLabels: Record<string, string> = {
        DAILY: t('dashboard.subscriptions.periodDaily'),
        MONTHLY: t('dashboard.subscriptions.periodMonthly'),
        ANNUAL: t('dashboard.subscriptions.periodAnnual'),
    };

    const statusLabels: Record<string, string> = {
        ACTIVE: t('dashboard.subscriptions.statusActive'),
        EXPIRED: t('dashboard.subscriptions.statusExpired'),
        CANCELLED: t('dashboard.subscriptions.statusCancelled'),
    };

    return [
        {
            key: 'id',
            header: t('dashboard.subscriptions.columnId'),
            hiddenOnMobile: true,
            render: sub => <span className="font-mono text-xs text-tertiary">{sub.id.slice(0, 8)}</span>,
        },
        {
            key: 'userId',
            header: t('dashboard.subscriptions.columnUserId'),
            hiddenOnMobile: true,
            render: sub => <span className="font-mono text-xs text-tertiary">{sub.userId.slice(0, 8)}</span>,
        },
        {
            key: 'planPeriod',
            header: t('dashboard.subscriptions.columnPlan'),
            sortable: true,
            render: sub => (
                <div className="flex flex-col">
                    <span className="font-medium">{periodLabels[sub.planPeriod] ?? sub.planPeriod}</span>
                    <span className="text-xs text-tertiary">{formatPrice(sub.planPriceInCents)}</span>
                </div>
            ),
        },
        {
            key: 'status',
            header: t('dashboard.subscriptions.columnStatus'),
            sortable: true,
            render: sub => (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${STATUS_COLORS[sub.status] ?? 'bg-tertiary/30'}`}>
                    {statusLabels[sub.status] ?? sub.status}
                </span>
            ),
        },
        {
            key: 'startDate',
            header: t('dashboard.subscriptions.columnStart'),
            sortable: true,
            render: sub => <span className="text-xs">{formatDate(sub.startDate)}</span>,
        },
        {
            key: 'endDate',
            header: t('dashboard.subscriptions.columnEnd'),
            hiddenOnMobile: true,
            sortable: true,
            render: sub => <span className="text-xs">{formatDate(sub.endDate)}</span>,
        },
        {
            key: 'actions',
            header: t('dashboard.subscriptions.columnActions'),
            render: sub => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            onEdit(sub);
                        }}
                        className="p-1.5 border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                        aria-label={t('dashboard.subscriptions.editAriaLabel')}
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            onDelete(sub);
                        }}
                        className="p-1.5 border rounded-xs border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label={t('dashboard.subscriptions.deleteAriaLabel')}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ];
};

const AdminSubscriptionList = ({ subscriptions, page, totalPages, isLoading, onPageChange, onEdit, onDelete }: AdminSubscriptionListProps) => {
    const { t } = useTranslation('admin');
    const { sortedData, sortBy, sortDirection, handleSort } = useSortableData(subscriptions);

    return (
        <DataTable
            columns={buildColumns(t, onEdit, onDelete)}
            data={sortedData}
            keyExtractor={sub => sub.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage={t('dashboard.subscriptions.empty')}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminSubscriptionList;
