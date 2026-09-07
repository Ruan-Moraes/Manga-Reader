import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getNews } from '../api/newsService';
import type { NewsQuery } from './news.types';

export const useNewsQuery = (query: NewsQuery) => useQuery({
    queryKey: [QUERY_KEYS.NEWS, query],
    queryFn: () => getNews(query),
    staleTime: 5 * 60 * 1000,
    placeholderData: previous => previous,
});
