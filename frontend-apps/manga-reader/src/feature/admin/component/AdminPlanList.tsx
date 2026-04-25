import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiEdit2 } from 'react-icons/fi';

import DataTable, { type Column } from '@shared/component/table/DataTable';
import TruncatedCell from '@shared/component/table/TruncatedCell';
import useSortableData from '@shared/hook/useSortableData';

import type { AdminPlan } from '../type/admin.types';

type AdminPlanListProps = {
    plans: AdminPlan[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (plan: AdminPlan) => void;
};

const AdminPlanList = ({
    plans,
    page,
    totalPages,
    isLoading,
    onPageChange,
    onEdit,
}: AdminPlanListProps) => {
    const { t, i18n } = useTranslation('admin');
    const { sortedData, sortBy, sortDirection, handleSort } =
        useSortableData(plans);

    const periodLabels = useMemo<Record<string, string>>(
        () => ({
            DAILY: t('planList.periodDaily'),
            MONTHLY: t('planList.periodMonthly'),
            ANNUAL: t('planList.periodAnnual'),
        }),
        [t],
    );

    const formatPrice = (cents: number) =>
        (cents / 100).toLocaleString(i18n.language, {
            style: 'currency',
            currency: 'BRL',
        });

    const columns: Column<AdminPlan>[] = [
        {
            key: 'period',
            header: t('planList.columnPeriod'),
            sortable: true,
            render: plan => (
                <span className="font-medium">
                    {periodLabels[plan.period] ?? plan.period}
                </span>
            ),
        },
        {
            key: 'priceInCents',
            header: t('planList.columnPrice'),
            sortable: true,
            render: plan => (
                <span className="font-medium">
                    {formatPrice(plan.priceInCents)}
                </span>
            ),
        },
        {
            key: 'description',
            header: t('planList.columnDescription'),
            hiddenOnMobile: true,
            render: plan => (
                <TruncatedCell
                    content={plan.description}
                    title={t('planList.descriptionTooltip')}
                />
            ),
        },
        {
            key: 'active',
            header: t('planList.columnStatus'),
            sortable: true,
            render: plan => (
                <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${
                        plan.active
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                    }`}
                >
                    {plan.active
                        ? t('planList.statusActive')
                        : t('planList.statusInactive')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('planList.columnActions'),
            render: plan => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            onEdit(plan);
                        }}
                        className="p-1.5 border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                        aria-label={t('planList.editAriaLabel')}
                    >
                        <FiEdit2 size={14} />
                    </button>
                </div>
            ),
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
