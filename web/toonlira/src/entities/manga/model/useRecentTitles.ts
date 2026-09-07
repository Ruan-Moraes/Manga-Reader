import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getRecentTitles } from '../api/titleService';

const useRecentTitles = (size = 6) =>
    useQuery({
        queryKey: [QUERY_KEYS.RECENT_TITLES, size],
        queryFn: () => getRecentTitles(size),
        staleTime: 1000 * 60 * 5,
    });

export default useRecentTitles;
