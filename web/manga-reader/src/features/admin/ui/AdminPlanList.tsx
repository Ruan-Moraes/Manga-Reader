import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import DataTable, { type Column } from '@ui/DataTable';
import { StatusPill } from '@ui/StatusPill';
import TruncatedCell from '@ui/TruncatedCell';
import useSortableData from '@shared/hook/useSortableData';

import type { AdminPlan } from '../model/admin.types';
import RowActions from './parts/RowActions';

type AdminPlanListProps = {
    plans: AdminPlan[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (plan: AdminPlan) => void;
};

const AdminPlanList = ({ plans, page, totalPages, isLoading, onPageChange, onEdit }: AdminPlanListProps) => {
    const { t, i18n } = useTranslation('admin');
    const { sortedData, sortBy, sortDirection, handleSort } = useSortableData(plans);

    const periodLabels = useMemo<Record<string, string>>(
        () => ({
            DAILY: t('planList.periodDaily'),
            MONTHLY: t('planList.periodMonthly'),
            ANNUAL: t('planList.periodAnnual'),
        }),
        [t],
    );

    const formatPrice = (cents: number) => (cents / 100).toLocaleString(i18n.language, { style: 'currency', currency: 'BRL' });

    const columns: Column<AdminPlan>[] = [
        {
            key: 'period',
            header: t('planList.columnPeriod'),
            sortable: true,
            render: plan => <span className="font-mr-bold text-mr-fg">{periodLabels[plan.period] ?? plan.period}</span>,
        },
        {
            key: 'priceInCents',
            header: t('planList.columnPrice'),
            sortable: true,
            render: plan => <span className="font-mr-bold tabular-nums text-mr-fg">{formatPrice(plan.priceInCents)}</span>,
        },
        {
            key: 'description',
            header: t('planList.columnDescription'),
            hideBelow: 'md',
            render: plan => <TruncatedCell content={plan.description} title={t('planList.descriptionTooltip')} />,
        },
        {
            key: 'active',
            header: t('planList.columnStatus'),
            sortable: true,
            render: plan => <StatusPill tone={plan.active ? 'live' : 'soon'}>{plan.active ? t('planList.statusActive') : t('planList.statusInactive')}</StatusPill>,
        },
        {
            key: 'actions',
            header: t('planList.columnActions'),
            align: 'right',
            render: plan => <RowActions onEdit={() => onEdit(plan)} editLabel={t('planList.editAriaLabel')} deleteLabel={t('planList.editAriaLabel')} />,
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={sortedData}
            keyExtractor={plan => plan.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage={t('planList.empty')}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminPlanList;
