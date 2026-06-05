import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import DataTable, { type Column } from '@ui/DataTable';
import useSortableData from '@shared/hook/useSortableData';

import type { AdminUser } from '../model/admin.types';
import { getLocale } from '@shared/lib/formatters';
import { Pencil, Trash2 } from 'lucide-react';

type AdminUserListProps = {
    users: AdminUser[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), {
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

    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${colors[role] ?? 'bg-tertiary/30'}`}>{role}</span>;
};

const StatusBadge = ({ banned, t }: { banned: boolean; t: TFunction }) => (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${banned ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
        {banned ? t('dashboard.users.statusBanned') : t('dashboard.users.statusActive')}
    </span>
);

const buildColumns = (t: TFunction, onEdit: (user: AdminUser) => void, onDelete: (user: AdminUser) => void): Column<AdminUser>[] => [
    {
        key: 'id',
        header: t('dashboard.users.columnId'),
        hiddenOnMobile: true,
        render: user => <span className="font-mono text-xs text-tertiary">{user.id.slice(0, 8)}</span>,
    },
    {
        key: 'name',
        header: t('dashboard.users.columnName'),
        sortable: true,
        render: user => <span className="font-medium">{user.name}</span>,
    },
    {
        key: 'email',
        header: t('dashboard.users.columnEmail'),
        sortable: true,
        render: user => <span className="text-tertiary">{user.email}</span>,
    },
    {
        key: 'role',
        header: t('dashboard.users.columnRole'),
        sortable: true,
        render: user => <RoleBadge role={user.role} />,
    },
    {
        key: 'status',
        header: t('dashboard.users.columnStatus'),
        sortable: true,
        render: user => <StatusBadge banned={user.banned} t={t} />,
    },
    {
        key: 'createdAt',
        header: t('dashboard.users.columnCreatedAt'),
        sortable: true,
        render: user => <span className="text-xs text-tertiary">{formatDate(user.createdAt)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.users.columnActions'),
        render: user => (
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onEdit(user);
                    }}
                    className="p-1.5 border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                    aria-label={t('dashboard.users.editAriaLabel')}
                >
                    <Pencil size={14} />
                </button>
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onDelete(user);
                    }}
                    className="p-1.5 border rounded-xs border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label={t('dashboard.users.deleteAriaLabel')}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        ),
    },
];

const AdminUserList = ({ users, page, totalPages, isLoading, onPageChange, onEdit, onDelete }: AdminUserListProps) => {
    const { t } = useTranslation('admin');
    const { sortedData, sortBy, sortDirection, handleSort } = useSortableData(users);

    return (
        <DataTable
            columns={buildColumns(t, onEdit, onDelete)}
            data={sortedData}
            keyExtractor={user => user.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage={t('dashboard.users.empty')}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminUserList;
