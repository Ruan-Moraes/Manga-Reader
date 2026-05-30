import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getAdminTags } from '../service/adminTagService';

const useAdminTags = () => {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_TAGS, page, search],
        queryFn: () => getAdminTags(page, 20, search || undefined),
    });

    return {
        tags: data?.content ?? [],
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

export default useAdminTags;
