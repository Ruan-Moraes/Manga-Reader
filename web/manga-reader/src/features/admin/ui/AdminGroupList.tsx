import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import DataTable, { type Column } from '@ui/DataTable';
import { StatusPill } from '@ui/StatusPill';
import { Avatar } from '@ui/Avatar';
import useSortableData from '@shared/hook/useSortableData';
import type { LanguageTag } from '@shared/type/i18n';
import { getLocale } from '@shared/lib/formatters';

import type { AdminGroup } from '../model/admin.types';
import { GROUP_STATUS_TONE, statusLabelKey, toneFor } from '../model/statusTone';
import RowActions from './parts/RowActions';

type AdminGroupListProps = {
    groups: AdminGroup[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (group: AdminGroup) => void;
    onDelete: (group: AdminGroup) => void;
    onRowClick?: (group: AdminGroup) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const buildColumns = (t: TFunction, lang: LanguageTag, onEdit: (group: AdminGroup) => void, onDelete: (group: AdminGroup) => void): Column<AdminGroup>[] => [
    {
        key: 'id',
        header: t('dashboard.groups.columnId'),
        hideBelow: 'md',
        render: group => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{group.id.slice(0, 8)}</span>,
    },
    {
        key: 'name',
        header: t('dashboard.groups.columnName'),
        sortable: true,
        render: group => {
            const name = group.name?.[lang] ?? group.name?.['pt-BR'] ?? '';

            return (
                <span className="flex items-center gap-2.5">
                    <Avatar name={name} size={32} />
                    <span className="font-mr-bold text-mr-fg">{name}</span>
                </span>
            );
        },
    },
    {
        key: 'username',
        header: t('dashboard.groups.columnUsername'),
        sortable: true,
        hideBelow: 'sm',
        render: group => <span className="font-mr-mono text-mr-tiny text-mr-accent-fg">@{group.username}</span>,
    },
    {
        key: 'status',
        header: t('dashboard.groups.columnStatus'),
        sortable: true,
        render: group => <StatusPill tone={toneFor(GROUP_STATUS_TONE, group.status)}>{t(statusLabelKey('group', group.status), { defaultValue: group.status })}</StatusPill>,
    },
    {
        key: 'membersCount',
        header: t('dashboard.groups.columnMembers'),
        sortable: true,
        hideBelow: 'md',
        render: group => <span className="tabular-nums text-mr-fg-subtle">{group.membersCount}</span>,
    },
    {
        key: 'totalTitles',
        header: t('dashboard.groups.columnTitles'),
        sortable: true,
        hideBelow: 'md',
        render: group => <span className="tabular-nums text-mr-fg-subtle">{group.totalTitles}</span>,
    },
    {
        key: 'platformJoinedAt',
        header: t('dashboard.groups.columnJoinedAt'),
        sortable: true,
        hideBelow: 'md',
        render: group => <span className="text-mr-fg-subtle">{formatDate(group.platformJoinedAt)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.groups.columnActions'),
        align: 'right',
        render: group => (
            <RowActions
                onEdit={() => onEdit(group)}
                onDelete={() => onDelete(group)}
                editLabel={t('dashboard.groups.editAriaLabel')}
                deleteLabel={t('dashboard.groups.deleteAriaLabel')}
            />
        ),
    },
];

const AdminGroupList = ({ groups, page, totalPages, isLoading, onPageChange, onEdit, onDelete, onRowClick }: AdminGroupListProps) => {
    const { t, i18n } = useTranslation('admin');
    const lang = i18n.language as LanguageTag;
    const { sortedData, sortBy, sortDirection, handleSort } = useSortableData(groups);

    return (
        <DataTable
            columns={buildColumns(t, lang, onEdit, onDelete)}
            data={sortedData}
            keyExtractor={group => group.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage={t('dashboard.groups.empty')}
            onRowClick={onRowClick}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminGroupList;
