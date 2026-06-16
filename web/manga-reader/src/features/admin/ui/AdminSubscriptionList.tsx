import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import DataTable, { type Column } from '@ui/DataTable';
import { StatusPill } from '@ui/StatusPill';
import useSortableData from '@shared/hook/useSortableData';
import { getLocale } from '@shared/lib/formatters';

import type { AdminSubscription } from '../model/admin.types';
import { SUBSCRIPTION_STATUS_TONE, toneFor } from '../model/statusTone';
import RowActions from './parts/RowActions';

type AdminSubscriptionListProps = {
    subscriptions: AdminSubscription[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (subscription: AdminSubscription) => void;
    onDelete: (subscription: AdminSubscription) => void;
};

const formatDate = (date: string) => new Date(date).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatPrice = (cents: number) => (cents / 100).toLocaleString(getLocale(), { style: 'currency', currency: 'BRL' });

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
            hideBelow: 'md',
            render: sub => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{sub.id.slice(0, 8)}</span>,
        },
        {
            key: 'userId',
            header: t('dashboard.subscriptions.columnUserId'),
            hideBelow: 'md',
            render: sub => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{sub.userId.slice(0, 8)}</span>,
        },
        {
            key: 'planPeriod',
            header: t('dashboard.subscriptions.columnPlan'),
            sortable: true,
            render: sub => (
                <div className="flex flex-col">
                    <span className="font-mr-bold text-mr-fg">{periodLabels[sub.planPeriod] ?? sub.planPeriod}</span>
                    <span className="text-mr-tiny tabular-nums text-mr-fg-subtle">{formatPrice(sub.planPriceInCents)}</span>
                </div>
            ),
        },
        {
            key: 'status',
            header: t('dashboard.subscriptions.columnStatus'),
            sortable: true,
            render: sub => <StatusPill tone={toneFor(SUBSCRIPTION_STATUS_TONE, sub.status)}>{statusLabels[sub.status] ?? sub.status}</StatusPill>,
        },
        {
            key: 'startDate',
            header: t('dashboard.subscriptions.columnStart'),
            sortable: true,
            hideBelow: 'sm',
            render: sub => <span className="text-mr-fg-subtle">{formatDate(sub.startDate)}</span>,
        },
        {
            key: 'endDate',
            header: t('dashboard.subscriptions.columnEnd'),
            hideBelow: 'md',
            sortable: true,
            render: sub => <span className="text-mr-fg-subtle">{formatDate(sub.endDate)}</span>,
        },
        {
            key: 'actions',
            header: t('dashboard.subscriptions.columnActions'),
            align: 'right',
            render: sub => (
                <RowActions
                    onEdit={() => onEdit(sub)}
                    onDelete={() => onDelete(sub)}
                    editLabel={t('dashboard.subscriptions.editAriaLabel')}
                    deleteLabel={t('dashboard.subscriptions.deleteAriaLabel')}
                />
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
