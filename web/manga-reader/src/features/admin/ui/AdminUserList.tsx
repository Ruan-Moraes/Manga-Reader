import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import DataTable, { type Column } from '@ui/DataTable';
import { Badge, type BadgeVariant } from '@ui/Badge';
import { StatusPill } from '@ui/StatusPill';
import { Avatar } from '@ui/Avatar';
import useSortableData from '@shared/hook/useSortableData';
import { getLocale } from '@shared/lib/formatters';

import type { AdminUser } from '../model/admin.types';
import RowActions from './parts/RowActions';

type AdminUserListProps = {
    users: AdminUser[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
    onRowClick?: (user: AdminUser) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ROLE_VARIANT: Record<string, BadgeVariant> = {
    ADMIN: 'danger',
    MODERATOR: 'accent',
    MEMBER: 'neutral',
};

const buildColumns = (t: TFunction, onEdit: (user: AdminUser) => void, onDelete: (user: AdminUser) => void): Column<AdminUser>[] => [
    {
        key: 'id',
        header: t('dashboard.users.columnId'),
        hideBelow: 'md',
        render: user => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{user.id.slice(0, 8)}</span>,
    },
    {
        key: 'name',
        header: t('dashboard.users.columnName'),
        sortable: true,
        render: user => (
            <span className="flex items-center gap-2.5">
                <Avatar name={user.name} size={32} />
                <span className="font-mr-bold text-mr-fg">{user.name}</span>
            </span>
        ),
    },
    {
        key: 'email',
        header: t('dashboard.users.columnEmail'),
        sortable: true,
        hideBelow: 'sm',
        render: user => <span className="text-mr-fg-subtle">{user.email}</span>,
    },
    {
        key: 'role',
        header: t('dashboard.users.columnRole'),
        sortable: true,
        render: user => <Badge variant={ROLE_VARIANT[user.role] ?? 'neutral'}>{t(`changeRole.roles.${user.role}`, user.role)}</Badge>,
    },
    {
        key: 'status',
        header: t('dashboard.users.columnStatus'),
        sortable: true,
        render: user => (
            <StatusPill tone={user.banned ? 'ended' : 'live'}>{user.banned ? t('dashboard.users.statusBanned') : t('dashboard.users.statusActive')}</StatusPill>
        ),
    },
    {
        key: 'createdAt',
        header: t('dashboard.users.columnCreatedAt'),
        sortable: true,
        hideBelow: 'md',
        render: user => <span className="text-mr-fg-subtle">{formatDate(user.createdAt)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.users.columnActions'),
        align: 'right',
        render: user => (
            <RowActions
                onEdit={() => onEdit(user)}
                onDelete={() => onDelete(user)}
                editLabel={t('dashboard.users.editAriaLabel')}
                deleteLabel={t('dashboard.users.deleteAriaLabel')}
            />
        ),
    },
];

const AdminUserList = ({ users, page, totalPages, isLoading, onPageChange, onEdit, onDelete, onRowClick }: AdminUserListProps) => {
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
            onRowClick={onRowClick}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminUserList;
