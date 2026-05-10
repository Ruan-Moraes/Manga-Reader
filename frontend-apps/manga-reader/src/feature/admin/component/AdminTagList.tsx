import DataTable, { type Column } from '@shared/component/table/DataTable';
import useSortableData from '@shared/hook/useSortableData';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import type { LanguageTag } from '@shared/type/i18n';
import type { AdminTag } from '../type/admin.types';

type AdminTagListProps = {
    tags: AdminTag[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (tag: AdminTag) => void;
    onDelete: (tag: AdminTag) => void;
};

const buildColumns = (
    t: TFunction,
    lang: LanguageTag,
    onEdit: (tag: AdminTag) => void,
    onDelete: (tag: AdminTag) => void,
): Column<AdminTag>[] => [
    {
        key: 'value',
        header: t('tagList.columnId'),
        hiddenOnMobile: true,
        render: tag => (
            <span className="font-mono text-xs text-tertiary">{tag.value}</span>
        ),
    },
    {
        key: 'label',
        header: t('tagList.columnName'),
        sortable: true,
        render: tag => (
            <span className="font-medium">
                {tag.label?.[lang] ?? tag.label?.['pt-BR'] ?? ''}
            </span>
        ),
    },
    {
        key: 'actions',
        header: t('tagList.columnActions'),
        render: tag => (
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onEdit(tag);
                    }}
                    className="p-1.5 border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                    aria-label={t('tagList.editAriaLabel')}
                >
                    <FiEdit2 size={14} />
                </button>
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onDelete(tag);
                    }}
                    className="p-1.5 border rounded-xs border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label={t('tagList.deleteAriaLabel')}
                >
                    <FiTrash2 size={14} />
                </button>
            </div>
        ),
    },
];

const AdminTagList = ({
    tags,
    page,
    totalPages,
    isLoading,
    onPageChange,
    onEdit,
    onDelete,
}: AdminTagListProps) => {
    const { t, i18n } = useTranslation('admin');
    const lang = i18n.language as LanguageTag;
    const { sortedData, sortBy, sortDirection, handleSort } =
        useSortableData(tags);

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
