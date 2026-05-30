import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import DataTable, { type Column } from '@shared/component/table/DataTable';
import useSortableData from '@shared/hook/useSortableData';
import type { LanguageTag } from '@shared/type/i18n';

import type { AdminNews } from '../type/admin.types';
import { getLocale } from '@shared/util/formatters';
import { Pencil, Trash2 } from 'lucide-react';

type AdminNewsListProps = {
    news: AdminNews[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (news: AdminNews) => void;
    onDelete: (news: AdminNews) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const CategoryBadge = ({ category }: { category: string }) => <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-tertiary/30">{category}</span>;

const buildColumns = (t: TFunction, lang: LanguageTag, onEdit: (news: AdminNews) => void, onDelete: (news: AdminNews) => void): Column<AdminNews>[] => [
    {
        key: 'id',
        header: t('dashboard.news.columnId'),
        hiddenOnMobile: true,
        render: news => <span className="font-mono text-xs text-tertiary">{news.id.slice(0, 8)}</span>,
    },
    {
        key: 'title',
        header: t('dashboard.news.columnTitle'),
        sortable: true,
        render: news => <span className="font-medium">{news.title?.[lang] ?? news.title?.['pt-BR'] ?? ''}</span>,
    },
    {
        key: 'category',
        header: t('dashboard.news.columnCategory'),
        sortable: true,
        render: news => <CategoryBadge category={news.category} />,
    },
    {
        key: 'views',
        header: t('dashboard.news.columnViews'),
        sortable: true,
        render: news => <span className="text-xs text-tertiary">{news.views}</span>,
    },
    {
        key: 'isFeatured',
        header: t('dashboard.news.columnFeatured'),
        sortable: true,
        render: news => (
            <span className={`text-xs ${news.isFeatured ? 'text-yellow-300' : 'text-tertiary'}`}>
                {news.isFeatured ? t('dashboard.news.featuredYes') : t('dashboard.news.featuredNo')}
            </span>
        ),
    },
    {
        key: 'publishedAt',
        header: t('dashboard.news.columnPublishedAt'),
        sortable: true,
        render: news => <span className="text-xs text-tertiary">{formatDate(news.publishedAt)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.news.columnActions'),
        render: news => (
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onEdit(news);
                    }}
                    className="p-1.5 border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                    aria-label={t('dashboard.news.editAriaLabel')}
                >
                    <Pencil size={14} />
                </button>
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onDelete(news);
                    }}
                    className="p-1.5 border rounded-xs border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label={t('dashboard.news.deleteAriaLabel')}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        ),
    },
];

const AdminNewsList = ({ news, page, totalPages, isLoading, onPageChange, onEdit, onDelete }: AdminNewsListProps) => {
    const { t, i18n } = useTranslation('admin');
    const lang = i18n.language as LanguageTag;
    const { sortedData, sortBy, sortDirection, handleSort } = useSortableData(news);

    return (
        <DataTable
            columns={buildColumns(t, lang, onEdit, onDelete)}
            data={sortedData}
            keyExtractor={n => n.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage={t('dashboard.news.empty')}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminNewsList;
