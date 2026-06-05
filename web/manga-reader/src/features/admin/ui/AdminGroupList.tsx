import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import DataTable, { type Column } from '@ui/DataTable';
import useSortableData from '@shared/hook/useSortableData';
import type { LanguageTag } from '@shared/type/i18n';

import type { AdminGroup } from '../model/admin.types';
import { getLocale } from '@shared/lib/formatters';
import { Pencil, Trash2 } from 'lucide-react';

type AdminGroupListProps = {
    groups: AdminGroup[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (group: AdminGroup) => void;
    onDelete: (group: AdminGroup) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), {
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

    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${colors[status] ?? 'bg-tertiary/30'}`}>{status}</span>;
};

const buildColumns = (t: TFunction, lang: LanguageTag, onEdit: (group: AdminGroup) => void, onDelete: (group: AdminGroup) => void): Column<AdminGroup>[] => [
    {
        key: 'id',
        header: t('dashboard.groups.columnId'),
        hiddenOnMobile: true,
        render: group => <span className="font-mono text-xs text-tertiary">{group.id.slice(0, 8)}</span>,
    },
    {
        key: 'name',
        header: t('dashboard.groups.columnName'),
        sortable: true,
        render: group => <span className="font-medium">{group.name?.[lang] ?? group.name?.['pt-BR'] ?? ''}</span>,
    },
    {
        key: 'username',
        header: t('dashboard.groups.columnUsername'),
        sortable: true,
        render: group => <span className="text-tertiary">@{group.username}</span>,
    },
    {
        key: 'status',
        header: t('dashboard.groups.columnStatus'),
        sortable: true,
        render: group => <StatusBadge status={group.status} />,
    },
    {
        key: 'membersCount',
        header: t('dashboard.groups.columnMembers'),
        sortable: true,
        render: group => <span className="text-xs text-tertiary">{group.membersCount}</span>,
    },
    {
        key: 'totalTitles',
        header: t('dashboard.groups.columnTitles'),
        sortable: true,
        render: group => <span className="text-xs text-tertiary">{group.totalTitles}</span>,
    },
    {
        key: 'platformJoinedAt',
        header: t('dashboard.groups.columnJoinedAt'),
        sortable: true,
        render: group => <span className="text-xs text-tertiary">{formatDate(group.platformJoinedAt)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.groups.columnActions'),
        render: group => (
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onEdit(group);
                    }}
                    className="p-1.5 border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                    aria-label={t('dashboard.groups.editAriaLabel')}
                >
                    <Pencil size={14} />
                </button>
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onDelete(group);
                    }}
                    className="p-1.5 border rounded-xs border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label={t('dashboard.groups.deleteAriaLabel')}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        ),
    },
];

const AdminGroupList = ({ groups, page, totalPages, isLoading, onPageChange, onEdit, onDelete }: AdminGroupListProps) => {
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
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminGroupList;
