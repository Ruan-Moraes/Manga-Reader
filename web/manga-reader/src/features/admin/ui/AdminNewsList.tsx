import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import DataTable, { type Column } from '@ui/DataTable';
import { Badge } from '@ui/Badge';
import useSortableData from '@shared/hook/useSortableData';
import type { LanguageTag } from '@shared/type/i18n';
import { getLocale } from '@shared/lib/formatters';

import type { AdminNews } from '../model/admin.types';
import RowActions from './parts/RowActions';

type AdminNewsListProps = {
    news: AdminNews[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (news: AdminNews) => void;
    onDelete: (news: AdminNews) => void;
    onRowClick?: (news: AdminNews) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const buildColumns = (t: TFunction, lang: LanguageTag, onEdit: (news: AdminNews) => void, onDelete: (news: AdminNews) => void): Column<AdminNews>[] => [
    {
        key: 'id',
        header: t('dashboard.news.columnId'),
        hideBelow: 'md',
        render: news => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{news.id.slice(0, 8)}</span>,
    },
    {
        key: 'title',
        header: t('dashboard.news.columnTitle'),
        sortable: true,
        render: news => <span className="font-mr-bold text-mr-fg">{news.title?.[lang] ?? news.title?.['pt-BR'] ?? ''}</span>,
    },
    {
        key: 'category',
        header: t('dashboard.news.columnCategory'),
        sortable: true,
        hideBelow: 'sm',
        render: news => <Badge variant="neutral">{news.category}</Badge>,
    },
    {
        key: 'views',
        header: t('dashboard.news.columnViews'),
        sortable: true,
        hideBelow: 'md',
        render: news => <span className="tabular-nums text-mr-fg-subtle">{news.views.toLocaleString(getLocale())}</span>,
    },
    {
        key: 'isFeatured',
        header: t('dashboard.news.columnFeatured'),
        sortable: true,
        render: news => <Badge variant={news.isFeatured ? 'accent' : 'neutral'}>{news.isFeatured ? t('dashboard.news.featuredYes') : t('dashboard.news.featuredNo')}</Badge>,
    },
    {
        key: 'status',
        header: t('dashboard.news.columnStatus'),
        sortable: true,
        render: news => <Badge variant={news.status === 'PUBLISHED' ? 'accent' : 'neutral'}>{news.status ? t(`newsForm.status.${news.status}`) : '—'}</Badge>,
    },
    {
        key: 'publishedAt',
        header: t('dashboard.news.columnPublishedAt'),
        sortable: true,
        hideBelow: 'md',
        render: news => <span className="text-mr-fg-subtle">{formatDate(news.publishedAt)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.news.columnActions'),
        align: 'right',
        render: news => (
            <RowActions
                onEdit={() => onEdit(news)}
                onDelete={() => onDelete(news)}
                editLabel={t('dashboard.news.editAriaLabel')}
                deleteLabel={t('dashboard.news.deleteAriaLabel')}
            />
        ),
    },
];

const AdminNewsList = ({ news, page, totalPages, isLoading, onPageChange, onEdit, onDelete, onRowClick }: AdminNewsListProps) => {
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
            onRowClick={onRowClick}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminNewsList;
