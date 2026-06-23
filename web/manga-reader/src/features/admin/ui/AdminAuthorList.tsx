import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import DataTable, { type Column } from '@ui/DataTable';
import useSortableData from '@shared/hook/useSortableData';
import { getLocale } from '@shared/lib/formatters';

import type { AdminAuthor } from '../model/admin.types';
import RowActions from './parts/RowActions';

type AdminAuthorListProps = {
    authors: AdminAuthor[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (author: AdminAuthor) => void;
    onDelete: (author: AdminAuthor) => void;
    onRowClick?: (author: AdminAuthor) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const buildColumns = (t: TFunction, onEdit: (a: AdminAuthor) => void, onDelete: (a: AdminAuthor) => void): Column<AdminAuthor>[] => [
    {
        key: 'name',
        header: t('authorList.columnName'),
        sortable: true,
        render: author => <span className="font-mr-bold text-mr-fg">{author.name}</span>,
    },
    {
        key: 'slug',
        header: t('authorList.columnSlug'),
        hideBelow: 'sm',
        render: author => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{author.slug}</span>,
    },
    {
        key: 'nationality',
        header: t('authorList.columnNationality'),
        hideBelow: 'sm',
        render: author => <span className="text-mr-fg-subtle">{author.nationality ?? '—'}</span>,
    },
    {
        key: 'createdAt',
        header: t('authorList.columnCreatedAt'),
        sortable: true,
        hideBelow: 'md',
        render: author => <span className="text-mr-fg-subtle">{formatDate(author.createdAt)}</span>,
    },
    {
        key: 'actions',
        header: t('authorList.columnActions'),
        align: 'right',
        render: author => (
            <RowActions
                onEdit={() => onEdit(author)}
                onDelete={() => onDelete(author)}
                editLabel={t('authorList.editAriaLabel')}
                deleteLabel={t('authorList.deleteAriaLabel')}
            />
        ),
    },
];

const AdminAuthorList = ({ authors, page, totalPages, isLoading, onPageChange, onEdit, onDelete, onRowClick }: AdminAuthorListProps) => {
    const { t } = useTranslation('admin');
    const { sortedData, sortBy, sortDirection, handleSort } = useSortableData(authors);

    return (
        <DataTable
            columns={buildColumns(t, onEdit, onDelete)}
            data={sortedData}
            keyExtractor={author => author.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage={t('authorList.empty')}
            onRowClick={onRowClick}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminAuthorList;
