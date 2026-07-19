import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import DataTable, { type Column } from '@ui/DataTable';
import useSortableData from '@shared/hook/useSortableData';
import { getLocale } from '@shared/lib/formatters';

import type { AdminPublisher } from '../model/admin.types';
import RowActions from './parts/RowActions';

type AdminPublisherListProps = {
    publishers: AdminPublisher[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (publisher: AdminPublisher) => void;
    onDelete: (publisher: AdminPublisher) => void;
    onRowClick?: (publisher: AdminPublisher) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const buildColumns = (t: TFunction, onEdit: (p: AdminPublisher) => void, onDelete: (p: AdminPublisher) => void): Column<AdminPublisher>[] => [
    {
        key: 'name',
        header: t('publisherList.columnName'),
        sortable: true,
        render: publisher => <span className="font-mr-bold text-mr-fg">{publisher.name}</span>,
    },
    {
        key: 'slug',
        header: t('publisherList.columnSlug'),
        hideBelow: 'sm',
        render: publisher => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{publisher.slug}</span>,
    },
    {
        key: 'country',
        header: t('publisherList.columnCountry'),
        hideBelow: 'sm',
        render: publisher => <span className="text-mr-fg-subtle">{publisher.country ?? '—'}</span>,
    },
    {
        key: 'website',
        header: t('publisherList.columnWebsite'),
        hideBelow: 'md',
        render: publisher =>
            publisher.website ? (
                <a
                    href={publisher.website}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="font-mr-mono text-mr-tiny text-mr-accent-fg hover:underline"
                >
                    {publisher.website}
                </a>
            ) : (
                <span className="text-mr-fg-subtle">—</span>
            ),
    },
    {
        key: 'createdAt',
        header: t('publisherList.columnCreatedAt'),
        sortable: true,
        hideBelow: 'md',
        render: publisher => <span className="text-mr-fg-subtle">{formatDate(publisher.createdAt)}</span>,
    },
    {
        key: 'actions',
        header: t('publisherList.columnActions'),
        align: 'right',
        render: publisher => (
            <RowActions
                onEdit={() => onEdit(publisher)}
                onDelete={() => onDelete(publisher)}
                editLabel={t('publisherList.editAriaLabel')}
                deleteLabel={t('publisherList.deleteAriaLabel')}
            />
        ),
    },
];

const AdminPublisherList = ({ publishers, page, totalPages, isLoading, onPageChange, onEdit, onDelete, onRowClick }: AdminPublisherListProps) => {
    const { t } = useTranslation('admin');
    const { sortedData, sortBy, sortDirection, handleSort } = useSortableData(publishers);

    return (
        <DataTable
            columns={buildColumns(t, onEdit, onDelete)}
            data={sortedData}
            keyExtractor={publisher => publisher.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage={t('publisherList.empty')}
            onRowClick={onRowClick}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminPublisherList;
