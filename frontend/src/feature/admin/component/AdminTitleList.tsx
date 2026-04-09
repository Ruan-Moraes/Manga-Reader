import { useNavigate } from 'react-router-dom';

import DataTable, { type Column } from '@shared/component/table/DataTable';

import type { AdminTitle } from '../type/admin.types';

type AdminTitleListProps = {
    titles: AdminTitle[];
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

const TypeBadge = ({ type }: { type: string }) => {
    const colors: Record<string, string> = {
        manga: 'bg-blue-500/20 text-blue-300',
        manhwa: 'bg-purple-500/20 text-purple-300',
        manhua: 'bg-green-500/20 text-green-300',
    };

    return (
        <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${colors[type] ?? 'bg-tertiary/30'}`}
        >
            {type}
        </span>
    );
};

const columns: Column<AdminTitle>[] = [
    {
        key: 'name',
        header: 'Nome',
        render: title => (
            <span className="font-medium">{title.name}</span>
        ),
    },
    {
        key: 'type',
        header: 'Tipo',
        render: title => <TypeBadge type={title.type} />,
    },
    {
        key: 'status',
        header: 'Status',
        render: title => (
            <span className="text-xs text-tertiary">{title.status ?? '—'}</span>
        ),
    },
    {
        key: 'chapters',
        header: 'Capítulos',
        render: title => (
            <span className="text-xs text-tertiary">{title.chaptersCount}</span>
        ),
    },
    {
        key: 'createdAt',
        header: 'Criado em',
        render: title => (
            <span className="text-xs text-tertiary">
                {formatDate(title.createdAt)}
            </span>
        ),
    },
];

const AdminTitleList = ({
    titles,
    page,
    totalPages,
    isLoading,
    onPageChange,
}: AdminTitleListProps) => {
    const navigate = useNavigate();

    return (
        <DataTable
            columns={columns}
            data={titles}
            keyExtractor={title => title.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage="Nenhum título encontrado."
            onRowClick={title =>
                navigate(`/Manga-Reader/dashboard/titles/${title.id}/edit`)
            }
        />
    );
};

export default AdminTitleList;
