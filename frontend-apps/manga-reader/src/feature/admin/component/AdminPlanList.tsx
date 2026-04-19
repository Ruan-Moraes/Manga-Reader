import DataTable, { type Column } from '@shared/component/table/DataTable';
import TruncatedCell from '@shared/component/table/TruncatedCell';
import useSortableData from '@shared/hook/useSortableData';
import { FiEdit2 } from 'react-icons/fi';

import type { AdminPlan } from '../type/admin.types';

type AdminPlanListProps = {
    plans: AdminPlan[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (plan: AdminPlan) => void;
};

const PERIOD_LABELS: Record<string, string> = {
    DAILY: 'Diário',
    MONTHLY: 'Mensal',
    ANNUAL: 'Anual',
};

const formatPrice = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

const columns = (onEdit: (plan: AdminPlan) => void): Column<AdminPlan>[] => [
    {
        key: 'period',
        header: 'Período',
        sortable: true,
        render: plan => (
            <span className="font-medium">
                {PERIOD_LABELS[plan.period] ?? plan.period}
            </span>
        ),
    },
    {
        key: 'priceInCents',
        header: 'Preço',
        sortable: true,
        render: plan => (
            <span className="font-medium">
                {formatPrice(plan.priceInCents)}
            </span>
        ),
    },
    {
        key: 'description',
        header: 'Descrição',
        hiddenOnMobile: true,
        render: plan => (
            <TruncatedCell
                content={plan.description}
                title="Descrição do plano"
            />
        ),
    },
    {
        key: 'active',
        header: 'Status',
        sortable: true,
        render: plan => (
            <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${
                    plan.active
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                }`}
            >
                {plan.active ? 'Ativo' : 'Inativo'}
            </span>
        ),
    },
    {
        key: 'actions',
        header: 'Ações',
        render: plan => (
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onEdit(plan);
                    }}
                    className="p-1.5 border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                    aria-label="Editar plano"
                >
                    <FiEdit2 size={14} />
                </button>
            </div>
        ),
    },
];

const AdminPlanList = ({
    plans,
    page,
    totalPages,
    isLoading,
    onPageChange,
    onEdit,
}: AdminPlanListProps) => {
    const { sortedData, sortBy, sortDirection, handleSort } =
        useSortableData(plans);

    return (
        <DataTable
            columns={columns(onEdit)}
            data={sortedData}
            keyExtractor={plan => plan.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage="Nenhum plano encontrado."
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminPlanList;
