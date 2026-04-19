import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getAdminPayments } from '../service/adminPaymentService';

const useAdminPayments = () => {
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_PAYMENTS, page, statusFilter],
        queryFn: () => getAdminPayments(page, 20, statusFilter || undefined),
    });

    return {
        payments: data?.content ?? [],
        page,
        totalPages: data?.totalPages ?? 0,
        totalElements: data?.totalElements ?? 0,
        isLoading,
        isError,
        statusFilter,
        setStatusFilter,
        setPage,
        refetch,
    };
};

export default useAdminPayments;
