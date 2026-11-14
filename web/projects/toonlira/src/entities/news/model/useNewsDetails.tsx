import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getNewsById, getRelatedNews } from '../api/newsService';

const useNewsDetails = (idOrSlug: string | undefined) => {
    const newsQuery = useQuery({
        queryKey: [QUERY_KEYS.NEWS_DETAIL, idOrSlug],
        queryFn: () => getNewsById(idOrSlug!),
        enabled: Boolean(idOrSlug),
        staleTime: 5 * 60 * 1000,
    });
    const relatedQuery = useQuery({
        queryKey: [QUERY_KEYS.NEWS_RELATED, idOrSlug],
        queryFn: () => getRelatedNews(idOrSlug!),
        enabled: newsQuery.isSuccess && Boolean(idOrSlug),
        staleTime: 5 * 60 * 1000,
    });
    return { news: newsQuery.data, relatedNews: relatedQuery.data ?? [],
        isLoading: newsQuery.isLoading, isError: newsQuery.isError, error: newsQuery.error,
        refetch: newsQuery.refetch, relatedError: relatedQuery.isError };
};
export default useNewsDetails;
