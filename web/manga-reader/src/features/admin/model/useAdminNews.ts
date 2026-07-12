import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getAdminNews } from '../api/adminNewsService';
import type { NewsStatus } from '@entities/news';

const useAdminNews = () => {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<NewsStatus | ''>('');
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState('updatedAt');
    const [direction, setDirection] = useState<'asc' | 'desc'>('desc');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_NEWS, page, search, status, category, sort, direction],
        queryFn: () => getAdminNews(page, 20, search || undefined, sort, direction, status, category),
    });

    return {
        news: data?.content ?? [],
        page,
        totalPages: data?.totalPages ?? 0,
        totalElements: data?.totalElements ?? 0,
        isLoading,
        isError,
        search,
        setSearch,
        status, setStatus, category, setCategory, sort, setSort, direction, setDirection,
        setPage,
        refetch,
    };
};

export default useAdminNews;
