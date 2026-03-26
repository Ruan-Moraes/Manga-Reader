import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { searchTitles } from '../service/titleService';

const useSearchTitles = (query: string, page = 0, size = 20) => {
    return useQuery({
        queryKey: [QUERY_KEYS.TITLES_SEARCH, query, page, size],
        queryFn: () => searchTitles(query, page, size),
        enabled: query.trim().length > 0,
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData,
    });
};

export default useSearchTitles;
