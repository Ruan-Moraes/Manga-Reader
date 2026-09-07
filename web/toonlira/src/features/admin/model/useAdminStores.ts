import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getAdminStores } from '../api/adminStoreService';

const useAdminStores = () => {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>();
    const query = useQuery({ queryKey: [QUERY_KEYS.ADMIN_STORES, page, search, status], queryFn: () => getAdminStores(page, 20, search || undefined, status) });
    return { stores: query.data?.content ?? [], page, setPage, search, setSearch, status, setStatus, totalPages: query.data?.totalPages ?? 0, totalElements: query.data?.totalElements ?? 0, isLoading: query.isLoading };
};
export default useAdminStores;
