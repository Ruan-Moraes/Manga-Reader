import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { chapterAdminGateway, type ChapterListQuery, type ChapterStatus } from '@entities/chapter';

const PAGE_SIZE = 20;

export type ChapterListFilters = {
    titleId?: string;
    status?: ChapterStatus[];
    publishedFrom?: string;
    publishedTo?: string;
};

/**
 * Listagem administrativa de capítulos — estado "server-side ready":
 * busca, filtros, ordenação e paginação viajam na query para o gateway;
 * o componente nunca recebe o conjunto completo.
 */
const useAdminChapters = (initialFilters: ChapterListFilters = {}) => {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [filters, setFiltersState] = useState<ChapterListFilters>(initialFilters);
    const [sort, setSort] = useState<NonNullable<ChapterListQuery['sort']>>('number');
    const [direction, setDirection] = useState<'asc' | 'desc'>('asc');

    const query: ChapterListQuery = {
        page,
        size: PAGE_SIZE,
        sort,
        direction,
        search: search || undefined,
        ...filters,
    };

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_CHAPTERS, query],
        queryFn: () => chapterAdminGateway.list(query),
        placeholderData: keepPreviousData,
    });

    const setFilters = (next: ChapterListFilters) => {
        setFiltersState(next);
        setPage(0);
    };

    return {
        chapters: data?.content ?? [],
        page,
        totalPages: data?.totalPages ?? 0,
        totalElements: data?.totalElements ?? 0,
        isLoading,
        isError,
        search,
        setSearch,
        setPage,
        filters,
        setFilters,
        sort,
        setSort,
        direction,
        setDirection,
        refetch,
    };
};

export default useAdminChapters;
