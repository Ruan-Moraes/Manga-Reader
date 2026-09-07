import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useNewsQuery, type NewsPeriod, type NewsSort } from '@entities/news';
import { LABEL_TYPES, useDomainLabels } from '@entities/label';

const toPage = (value: string | null) => Math.max(0, Number(value ?? 1) - 1 || 0);

export const useNewsPage = () => {
    const [params, setParams] = useSearchParams();
    const page = toPage(params.get('page'));
    const q = params.get('q') ?? '';
    const category = params.get('category') ?? '';
    const period = (params.get('period') ?? 'all') as NewsPeriod;
    const sort = (params.get('sort') ?? 'recent') as NewsSort;
    const categoriesQuery = useDomainLabels(LABEL_TYPES.NEWS_CATEGORY);
    const newsQuery = useNewsQuery({ page, size: 10, q, category, period, sort });

    const update = useCallback((values: Record<string, string | number | undefined>) => {
        setParams(current => {
            const next = new URLSearchParams(current);
            Object.entries(values).forEach(([key, value]) => {
                if (value === undefined || value === '' || value === 'all' || (key === 'page' && value === 1)) next.delete(key);
                else next.set(key, String(value));
            });
            if (!('page' in values)) next.delete('page');
            return next;
        });
    }, [setParams]);

    const items = newsQuery.data?.content ?? [];
    return useMemo(() => ({
        page, q, category, period, sort, categories: categoriesQuery.data ?? [],
        items, hero: page === 0 ? items[0] : undefined,
        feed: page === 0 ? items.slice(1) : items,
        totalPages: newsQuery.data?.totalPages ?? 0,
        totalElements: newsQuery.data?.totalElements ?? 0,
        isLoading: newsQuery.isLoading, isFetching: newsQuery.isFetching,
        isError: newsQuery.isError, refetch: newsQuery.refetch, update,
    }), [page, q, category, period, sort, categoriesQuery.data, items, newsQuery.data, newsQuery.isLoading, newsQuery.isFetching, newsQuery.isError, newsQuery.refetch, update]);
};
