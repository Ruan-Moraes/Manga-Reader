import { useNavigate } from 'react-router-dom';

import DataTable, { type Column } from '@shared/component/table/DataTable';

import type { AdminUser } from '../type/admin.types';

type AdminUserListProps = {
    users: AdminUser[];
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

const RoleBadge = ({ role }: { role: string }) => {
    const colors: Record<string, string> = {
        ADMIN: 'bg-red-500/20 text-red-300',
        MODERATOR: 'bg-yellow-500/20 text-yellow-300',
        MEMBER: 'bg-blue-500/20 text-blue-300',
    };

    return (
        <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${colors[role] ?? 'bg-tertiary/30'}`}
        >
            {role}
        </span>
    );
};

const StatusBadge = ({ banned }: { banned: boolean }) => (
    <span
        className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${
            banned ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
        }`}
    >
        {banned ? 'Banido' : 'Ativo'}
    </span>
);

const columns: Column<AdminUser>[] = [
    {
        key: 'name',
        header: 'Nome',
        render: user => (
            <span className="font-medium">{user.name}</span>
        ),
    },
    {
        key: 'email',
        header: 'Email',
        render: user => (
            <span className="text-tertiary">{user.email}</span>
        ),
    },
    {
        key: 'role',
        header: 'Role',
        render: user => <RoleBadge role={user.role} />,
    },
    {
        key: 'status',
        header: 'Status',
        render: user => <StatusBadge banned={user.banned} />,
    },
    {
        key: 'createdAt',
        header: 'Cadastro',
        render: user => (
            <span className="text-xs text-tertiary">
                {formatDate(user.createdAt)}
            </span>
        ),
    },
];

const AdminUserList = ({
    users,
    page,
    totalPages,
    isLoading,
    onPageChange,
}: AdminUserListProps) => {
    const navigate = useNavigate();

    return (
        <DataTable
            columns={columns}
            data={users}
            keyExtractor={user => user.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage="Nenhum usuário encontrado."
            onRowClick={user =>
                navigate(`/Manga-Reader/dashboard/users/${user.id}`)
            }
        />
    );
};

export default AdminUserList;
