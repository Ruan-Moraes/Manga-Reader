import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getAdminPublishers } from '../api/adminPublisherService';

const useAdminPublishers = () => {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_PUBLISHERS, page, search],
        queryFn: () => getAdminPublishers(page, 20, search || undefined),
    });

    return {
        publishers: data?.content ?? [],
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

export default useAdminPublishers;
