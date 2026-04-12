import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getFinancialSummary } from '../service/adminPaymentService';

const useFinancialSummary = () => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_FINANCIAL_SUMMARY],
        queryFn: getFinancialSummary,
        staleTime: 60_000,
    });

    return {
        summary: data ?? null,
        isLoading,
        isError,
        refetch,
    };
};

export default useFinancialSummary;
