import { useNavigate } from 'react-router-dom';

import DataTable, { type Column } from '@shared/component/table/DataTable';
import useSortableData from '@shared/hook/useSortableData';

import type { AdminGroup } from '../type/admin.types';

type AdminGroupListProps = {
    groups: AdminGroup[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        ACTIVE: 'bg-green-500/20 text-green-300',
        INACTIVE: 'bg-tertiary/30 text-tertiary',
        HIATUS: 'bg-yellow-500/20 text-yellow-300',
    };

    return (
        <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${colors[status] ?? 'bg-tertiary/30'}`}
        >
            {status}
        </span>
    );
};

const columns: Column<AdminGroup>[] = [
    {
        key: 'name',
        header: 'Nome',
        sortable: true,
        render: group => <span className="font-medium">{group.name}</span>,
    },
    {
        key: 'username',
        header: 'Username',
        sortable: true,
        render: group => (
            <span className="text-tertiary">@{group.username}</span>
        ),
    },
    {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: group => <StatusBadge status={group.status} />,
    },
    {
        key: 'membersCount',
        header: 'Membros',
        sortable: true,
        render: group => (
            <span className="text-xs text-tertiary">{group.membersCount}</span>
        ),
    },
    {
        key: 'totalTitles',
        header: 'Títulos',
        sortable: true,
        render: group => (
            <span className="text-xs text-tertiary">{group.totalTitles}</span>
        ),
    },
    {
        key: 'platformJoinedAt',
        header: 'Entrada',
        sortable: true,
        render: group => (
            <span className="text-xs text-tertiary">
                {formatDate(group.platformJoinedAt)}
            </span>
        ),
    },
];

const AdminGroupList = ({
    groups,
    page,
    totalPages,
    isLoading,
    onPageChange,
}: AdminGroupListProps) => {
    const navigate = useNavigate();
    const { sortedData, sortBy, sortDirection, handleSort } =
        useSortableData(groups);

    return (
        <DataTable
            columns={columns}
            data={sortedData}
            keyExtractor={group => group.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage="Nenhum grupo encontrado."
            onRowClick={group =>
                navigate(`/Manga-Reader/dashboard/groups/${group.id}`)
            }
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminGroupList;
