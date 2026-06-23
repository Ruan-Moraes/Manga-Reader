import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import DataTable, { type Column } from '@ui/DataTable';
import useSortableData from '@shared/hook/useSortableData';
import type { LanguageTag } from '@shared/type/i18n';

import type { AdminTag } from '../model/admin.types';
import RowActions from './parts/RowActions';

type AdminTagListProps = {
    tags: AdminTag[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (tag: AdminTag) => void;
    onDelete: (tag: AdminTag) => void;
};

const buildColumns = (t: TFunction, lang: LanguageTag, onEdit: (tag: AdminTag) => void, onDelete: (tag: AdminTag) => void): Column<AdminTag>[] => [
    {
        key: 'value',
        header: t('tagList.columnId'),
        hideBelow: 'sm',
        render: tag => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{tag.value}</span>,
    },
    {
        key: 'label',
        header: t('tagList.columnName'),
        sortable: true,
        render: tag => <span className="font-mr-bold text-mr-fg">{tag.label?.[lang] ?? tag.label?.['pt-BR'] ?? ''}</span>,
    },
    {
        key: 'actions',
        header: t('tagList.columnActions'),
        align: 'right',
        render: tag => (
            <RowActions
                onEdit={() => onEdit(tag)}
                onDelete={() => onDelete(tag)}
                editLabel={t('tagList.editAriaLabel')}
                deleteLabel={t('tagList.deleteAriaLabel')}
            />
        ),
    },
];

const AdminTagList = ({ tags, page, totalPages, isLoading, onPageChange, onEdit, onDelete }: AdminTagListProps) => {
    const { t, i18n } = useTranslation('admin');
    const lang = i18n.language as LanguageTag;
    const { sortedData, sortBy, sortDirection, handleSort } = useSortableData(tags);

    return (
        <DataTable
            columns={buildColumns(t, lang, onEdit, onDelete)}
            data={sortedData}
            keyExtractor={tag => String(tag.value)}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage={t('tagList.empty')}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminTagList;
