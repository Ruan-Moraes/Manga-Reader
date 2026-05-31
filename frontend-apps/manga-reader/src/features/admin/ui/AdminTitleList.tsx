import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import DataTable, { type Column } from '@ui/DataTable';
import useSortableData from '@shared/hook/useSortableData';
import type { LanguageTag } from '@shared/type/i18n';
import { getLocale } from '@shared/lib/formatters';

import type { AdminTitle } from '../model/admin.types';
import { Pencil, Trash2 } from 'lucide-react';

type AdminTitleListProps = {
    titles: AdminTitle[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (title: AdminTitle) => void;
    onDelete: (title: AdminTitle) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), {
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

    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${colors[type] ?? 'bg-tertiary/30'}`}>{type}</span>;
};

const buildColumns = (t: TFunction, lang: LanguageTag, onEdit: (title: AdminTitle) => void, onDelete: (title: AdminTitle) => void): Column<AdminTitle>[] => [
    {
        key: 'id',
        header: t('dashboard.titles.columnId'),
        hiddenOnMobile: true,
        render: title => <span className="font-mono text-xs text-tertiary">{title.id.slice(0, 8)}</span>,
    },
    {
        key: 'name',
        header: t('dashboard.titles.columnName'),
        sortable: true,
        render: title => <span className="font-medium">{title.name?.[lang] ?? title.name?.['pt-BR'] ?? ''}</span>,
    },
    {
        key: 'type',
        header: t('dashboard.titles.columnType'),
        sortable: true,
        render: title => <TypeBadge type={title.type} />,
    },
    {
        key: 'status',
        header: t('dashboard.titles.columnStatus'),
        sortable: true,
        render: title => <span className="text-xs text-tertiary">{title.status ?? '—'}</span>,
    },
    {
        key: 'chaptersCount',
        header: t('dashboard.titles.columnChapters'),
        sortable: true,
        render: title => <span className="text-xs text-tertiary">{title.chaptersCount}</span>,
    },
    {
        key: 'createdAt',
        header: t('dashboard.titles.columnCreatedAt'),
        sortable: true,
        render: title => <span className="text-xs text-tertiary">{formatDate(title.createdAt)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.titles.columnActions'),
        render: title => (
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onEdit(title);
                    }}
                    className="p-1.5 border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                    aria-label={t('dashboard.titles.editAriaLabel')}
                >
                    <Pencil size={14} />
                </button>
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onDelete(title);
                    }}
                    className="p-1.5 border rounded-xs border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label={t('dashboard.titles.deleteAriaLabel')}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        ),
    },
];

const AdminTitleList = ({ titles, page, totalPages, isLoading, onPageChange, onEdit, onDelete }: AdminTitleListProps) => {
    const { t, i18n } = useTranslation('admin');
    const lang = i18n.language as LanguageTag;
    const { sortedData, sortBy, sortDirection, handleSort } = useSortableData(titles);

    return (
        <DataTable
            columns={buildColumns(t, lang, onEdit, onDelete)}
            data={sortedData}
            keyExtractor={title => title.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage={t('dashboard.titles.empty')}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminTitleList;
