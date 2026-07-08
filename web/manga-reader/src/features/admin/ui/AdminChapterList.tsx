import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Copy } from 'lucide-react';

import DataTable, { type Column, type SortDirection } from '@ui/DataTable';
import { StatusPill } from '@ui/StatusPill';
import { Button } from '@ui/Button';
import { formatShortDate, getLocale } from '@shared/lib/formatters';
import type { AdminChapter, ChapterListQuery } from '@entities/chapter';

import { CHAPTER_STATUS_TONE, statusLabelKey, toneFor } from '../model/statusTone';
import RowActions, { rowActionBtnClass } from './parts/RowActions';

type SortField = NonNullable<ChapterListQuery['sort']>;

type AdminChapterListProps = {
    chapters: AdminChapter[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    isError?: boolean;
    onRetry?: () => void;
    onPageChange: (page: number) => void;
    onEdit: (chapter: AdminChapter) => void;
    onDuplicate: (chapter: AdminChapter) => void;
    onDelete: (chapter: AdminChapter) => void;
    onRowClick?: (chapter: AdminChapter) => void;
    sort: SortField;
    direction: SortDirection;
    onSortChange: (sort: SortField, direction: SortDirection) => void;
    // Seleção múltipla + ações em lote
    selectedKeys: Set<string>;
    onToggleRow: (id: string) => void;
    onToggleAll: (ids: string[]) => void;
    onBulkStatus: () => void;
    onBulkDelete: () => void;
    onClearSelection: () => void;
};

/** Campos ordenáveis no "servidor" (gateway) — as demais colunas não ordenam. */
const SORTABLE_FIELDS: SortField[] = ['number', 'publishedAt', 'updatedAt', 'reads'];

const formatDate = (date: string | null) => (date && formatShortDate(date)) || '—';

const buildColumns = (
    t: TFunction,
    onEdit: AdminChapterListProps['onEdit'],
    onDuplicate: AdminChapterListProps['onDuplicate'],
    onDelete: AdminChapterListProps['onDelete'],
): Column<AdminChapter>[] => [
    {
        key: 'number',
        header: t('dashboard.chapters.columnNumber'),
        sortable: true,
        render: chapter => <span className="tabular-nums font-mr-bold text-mr-fg">{chapter.number}</span>,
    },
    {
        key: 'title',
        header: t('dashboard.chapters.columnTitle'),
        render: chapter => (
            <div className="min-w-0">
                <div className="truncate font-mr-bold text-mr-fg">{chapter.title}</div>
                <div className="truncate text-mr-tiny text-mr-fg-subtle">{chapter.titleName}</div>
            </div>
        ),
    },
    {
        key: 'status',
        header: t('dashboard.chapters.columnStatus'),
        render: chapter => (
            <StatusPill tone={toneFor(CHAPTER_STATUS_TONE, chapter.status)}>{t(statusLabelKey('chapter', chapter.status), { defaultValue: chapter.status })}</StatusPill>
        ),
    },
    {
        key: 'pages',
        header: t('dashboard.chapters.columnPages'),
        hideBelow: 'sm',
        render: chapter => (
            <span className="tabular-nums text-mr-fg-subtle">
                {chapter.readyPagesCount === chapter.pagesCount ? chapter.pagesCount : `${chapter.readyPagesCount}/${chapter.pagesCount}`}
            </span>
        ),
    },
    {
        key: 'publishedAt',
        header: t('dashboard.chapters.columnPublishedAt'),
        sortable: true,
        hideBelow: 'md',
        render: chapter => <span className="text-mr-fg-subtle">{formatDate(chapter.publishedAt)}</span>,
    },
    {
        key: 'updatedAt',
        header: t('dashboard.chapters.columnUpdatedAt'),
        sortable: true,
        hideBelow: 'md',
        render: chapter => <span className="text-mr-fg-subtle">{formatDate(chapter.updatedAt)}</span>,
    },
    {
        key: 'reads',
        header: t('dashboard.chapters.columnReads'),
        sortable: true,
        hideBelow: 'md',
        align: 'right',
        render: chapter => <span className="tabular-nums text-mr-fg-subtle">{chapter.reads.toLocaleString(getLocale())}</span>,
    },
    {
        key: 'completionRate',
        header: t('dashboard.chapters.columnCompletion'),
        hideBelow: 'md',
        align: 'right',
        render: chapter => <span className="tabular-nums text-mr-fg-subtle">{chapter.reads > 0 ? `${Math.round(chapter.completionRate * 100)}%` : '—'}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.chapters.columnActions'),
        align: 'right',
        render: chapter => (
            <RowActions
                onEdit={() => onEdit(chapter)}
                onDelete={() => onDelete(chapter)}
                editLabel={t('dashboard.chapters.editAriaLabel')}
                deleteLabel={t('dashboard.chapters.deleteAriaLabel')}
                extra={
                    <button
                        type="button"
                        aria-label={t('dashboard.chapters.duplicateAriaLabel')}
                        title={t('dashboard.chapters.duplicateAriaLabel')}
                        onClick={e => {
                            e.stopPropagation();
                            onDuplicate(chapter);
                        }}
                        className={rowActionBtnClass}
                    >
                        <Copy size={15} />
                    </button>
                }
            />
        ),
    },
];

const AdminChapterList = ({
    chapters,
    page,
    totalPages,
    isLoading,
    isError,
    onRetry,
    onPageChange,
    onEdit,
    onDuplicate,
    onDelete,
    onRowClick,
    sort,
    direction,
    onSortChange,
    selectedKeys,
    onToggleRow,
    onToggleAll,
    onBulkStatus,
    onBulkDelete,
    onClearSelection,
}: AdminChapterListProps) => {
    const { t } = useTranslation('admin');

    const handleSort = (key: string, dir: SortDirection) => {
        if (SORTABLE_FIELDS.includes(key as SortField)) onSortChange(key as SortField, dir);
    };

    return (
        <div className="flex flex-col gap-3">
            {selectedKeys.size > 0 && (
                <div className="flex flex-wrap items-center gap-2.5 rounded-mr-md border border-mr-accent-50 bg-mr-accent-25 px-4 py-2.5">
                    <span className="text-mr-small font-mr-bold text-mr-fg">{t('dashboard.chapters.bulk.selected', { count: selectedKeys.size })}</span>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <Button variant="raised" size="sm" onClick={onBulkStatus}>
                            {t('dashboard.chapters.bulk.changeStatus')}
                        </Button>
                        <Button variant="ghost" size="sm" danger onClick={onBulkDelete}>
                            {t('dashboard.chapters.bulk.delete')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClearSelection}>
                            {t('dashboard.chapters.bulk.clear')}
                        </Button>
                    </div>
                </div>
            )}

            <DataTable
                columns={buildColumns(t, onEdit, onDuplicate, onDelete)}
                data={chapters}
                keyExtractor={chapter => chapter.id}
                page={page}
                totalPages={totalPages}
                onPageChange={onPageChange}
                isLoading={isLoading}
                isError={isError}
                onRetry={onRetry}
                errorTitle={t('dashboard.chapters.errorTitle')}
                errorMessage={t('dashboard.chapters.errorMessage')}
                retryLabel={t('common.retry')}
                emptyTitle={t('dashboard.chapters.emptyTitle')}
                emptyMessage={t('dashboard.chapters.empty')}
                onRowClick={onRowClick}
                sortBy={sort}
                sortDirection={direction}
                onSort={handleSort}
                selectable
                selectedKeys={selectedKeys}
                onToggleRow={onToggleRow}
                onToggleAll={onToggleAll}
                selectAllLabel={t('dashboard.chapters.selectAllAriaLabel')}
                selectRowLabel={chapter => t('dashboard.chapters.selectRowAriaLabel', { number: chapter.number })}
            />
        </div>
    );
};

export default AdminChapterList;
