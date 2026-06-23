import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import DataTable, { type Column } from '@ui/DataTable';
import { Badge } from '@ui/Badge';
import { StatusPill } from '@ui/StatusPill';
import useSortableData from '@shared/hook/useSortableData';
import type { LanguageTag } from '@shared/type/i18n';
import { getLocale } from '@shared/lib/formatters';

import type { AdminTitle } from '../model/admin.types';
import { TITLE_STATUS_TONE, statusLabelKey, toneFor } from '../model/statusTone';
import RowActions from './parts/RowActions';

type AdminTitleListProps = {
    titles: AdminTitle[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (title: AdminTitle) => void;
    onDelete: (title: AdminTitle) => void;
    onRowClick?: (title: AdminTitle) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const buildColumns = (t: TFunction, lang: LanguageTag, onEdit: (title: AdminTitle) => void, onDelete: (title: AdminTitle) => void): Column<AdminTitle>[] => [
    {
        key: 'id',
        header: t('dashboard.titles.columnId'),
        hideBelow: 'md',
        render: title => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{title.id.slice(0, 8)}</span>,
    },
    {
        key: 'name',
        header: t('dashboard.titles.columnName'),
        sortable: true,
        render: title => <span className="font-mr-bold text-mr-fg">{title.name?.[lang] ?? title.name?.['pt-BR'] ?? ''}</span>,
    },
    {
        key: 'type',
        header: t('dashboard.titles.columnType'),
        sortable: true,
        hideBelow: 'sm',
        render: title => <Badge variant="neutral">{title.type}</Badge>,
    },
    {
        key: 'status',
        header: t('dashboard.titles.columnStatus'),
        sortable: true,
        render: title => <StatusPill tone={toneFor(TITLE_STATUS_TONE, title.status)}>{t(statusLabelKey('title', title.status), { defaultValue: title.status ?? '—' })}</StatusPill>,
    },
    {
        key: 'authors',
        header: t('dashboard.titles.columnAuthor'),
        hideBelow: 'sm',
        render: title => {
            const names = title.authors?.length ? title.authors.map(a => a.authorName).filter(Boolean).join(', ') : title.author;
            return <span className="text-mr-fg-subtle">{names || '—'}</span>;
        },
    },
    {
        key: 'chaptersCount',
        header: t('dashboard.titles.columnChapters'),
        sortable: true,
        hideBelow: 'md',
        render: title => <span className="tabular-nums text-mr-fg-subtle">{title.chaptersCount}</span>,
    },
    {
        key: 'createdAt',
        header: t('dashboard.titles.columnCreatedAt'),
        sortable: true,
        hideBelow: 'md',
        render: title => <span className="text-mr-fg-subtle">{formatDate(title.createdAt)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.titles.columnActions'),
        align: 'right',
        render: title => (
            <RowActions
                onEdit={() => onEdit(title)}
                onDelete={() => onDelete(title)}
                editLabel={t('dashboard.titles.editAriaLabel')}
                deleteLabel={t('dashboard.titles.deleteAriaLabel')}
            />
        ),
    },
];

const AdminTitleList = ({ titles, page, totalPages, isLoading, onPageChange, onEdit, onDelete, onRowClick }: AdminTitleListProps) => {
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
            onRowClick={onRowClick}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminTitleList;
