import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { searchTitles } from '../api/titleService';

const useSearchTitles = (query: string, page = 0, size = 20) => {
    const normalizedQuery = query.trim().replace(/\s+/g, ' ');

    return useQuery({
        queryKey: [QUERY_KEYS.TITLES_SEARCH, normalizedQuery, page, size],
        queryFn: ({ signal }) => searchTitles(normalizedQuery, page, size, signal),
        enabled: normalizedQuery.length >= 2 && normalizedQuery.length <= 100,
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData,
    });
};

export default useSearchTitles;
