import { useNavigate } from 'react-router-dom';

import DataTable, { type Column } from '@shared/component/table/DataTable';
import useSortableData from '@shared/hook/useSortableData';

import type { AdminNews } from '../type/admin.types';

type AdminNewsListProps = {
    news: AdminNews[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const CategoryBadge = ({ category }: { category: string }) => {
    const colors: Record<string, string> = {
        PRINCIPAIS: 'bg-red-500/20 text-red-300',
        LANCAMENTOS: 'bg-green-500/20 text-green-300',
        ADAPTACOES: 'bg-purple-500/20 text-purple-300',
        INDUSTRIA: 'bg-blue-500/20 text-blue-300',
        EVENTOS: 'bg-yellow-500/20 text-yellow-300',
    };

    return (
        <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${colors[category] ?? 'bg-tertiary/30'}`}
        >
            {category}
        </span>
    );
};

const columns: Column<AdminNews>[] = [
    {
        key: 'title',
        header: 'Título',
        sortable: true,
        render: news => <span className="font-medium">{news.title}</span>,
    },
    {
        key: 'category',
        header: 'Categoria',
        sortable: true,
        render: news => <CategoryBadge category={news.category} />,
    },
    {
        key: 'views',
        header: 'Views',
        sortable: true,
        render: news => (
            <span className="text-xs text-tertiary">{news.views}</span>
        ),
    },
    {
        key: 'isFeatured',
        header: 'Destaque',
        sortable: true,
        render: news => (
            <span
                className={`text-xs ${news.isFeatured ? 'text-yellow-300' : 'text-tertiary'}`}
            >
                {news.isFeatured ? 'Sim' : 'Não'}
            </span>
        ),
    },
    {
        key: 'publishedAt',
        header: 'Publicado em',
        sortable: true,
        render: news => (
            <span className="text-xs text-tertiary">
                {formatDate(news.publishedAt)}
            </span>
        ),
    },
];

const AdminNewsList = ({
    news,
    page,
    totalPages,
    isLoading,
    onPageChange,
}: AdminNewsListProps) => {
    const navigate = useNavigate();
    const { sortedData, sortBy, sortDirection, handleSort } =
        useSortableData(news);

    return (
        <DataTable
            columns={columns}
            data={sortedData}
            keyExtractor={n => n.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage="Nenhuma notícia encontrada."
            onRowClick={n =>
                navigate(`/Manga-Reader/dashboard/news/${n.id}/edit`)
            }
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminNewsList;
