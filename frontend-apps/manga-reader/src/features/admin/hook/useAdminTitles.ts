import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getAdminTitles } from '../service/adminTitleService';

const useAdminTitles = () => {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_TITLES, page, search],
        queryFn: () => getAdminTitles(page, 20, search || undefined),
    });

    return {
        titles: data?.content ?? [],
        page,
        totalPages: data?.totalPages ?? 0,
        totalElements: data?.totalElements ?? 0,
        isLoading,
        isError,
        search,
        setSearch,
        setPage,
        refetch,
    };
};

export default useAdminTitles;
