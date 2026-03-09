import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type { NewsCategory, NewsFilter, NewsItem } from '../type/news.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const periodInDays = { today: 1, week: 7, month: 30 } as const;

// ---------------------------------------------------------------------------
// Public API — Async (chamadas ao backend)
// ---------------------------------------------------------------------------

export const getNews = async (
    page = 0,
    size = 20,
): Promise<PageResponse<NewsItem>> => {
    const response = await api.get<ApiResponse<PageResponse<NewsItem>>>(
        API_URLS.NEWS,
        { params: { page, size } },
    );

    return response.data.data;
};

export const getNewsById = async (id: string): Promise<NewsItem> => {
    const response = await api.get<ApiResponse<NewsItem>>(
        `${API_URLS.NEWS}/${id}`,
    );

    return response.data.data;
};

export const getRelatedNews = async (
    newsId: string,
    limit = 6,
): Promise<NewsItem[]> => {
    const response = await api.get<ApiResponse<NewsItem[]>>(
        `${API_URLS.NEWS}/${newsId}/related`,
        { params: { limit } },
    );

    return response.data.data;
};

export const isNewsFresh = (publishedAt: string): boolean =>
    Date.now() - new Date(publishedAt).getTime() < 86_400_000;

export { default as formatRelativeDate } from '@shared/service/util/formatRelativeDate';

export const formatNewsDate = (date: string) =>
    new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short',
    }).format(new Date(date));

/** Todas as categorias disponíveis. */
export const newsCategories: NewsCategory[] = [
    'Principais',
    'Lançamentos',
    'Adaptações',
    'Indústria',
    'Entrevistas',
    'Eventos',
    'Curiosidades',
    'Mercado',
    'Internacional',
];

// ---------------------------------------------------------------------------
// Sync filter — usado pelos componentes de rota em useMemo
// ---------------------------------------------------------------------------

export const filterNews = (
    items: NewsItem[],
    filters: NewsFilter,
): NewsItem[] => {
    const { tab, query, period, source, sort } = filters;
    const normalizedQuery = query.trim().toLowerCase();
    const now = Date.now();
    const limitDate =
        period === 'all'
            ? null
            : new Date(now - periodInDays[period] * 86_400_000);

    const filtered = items.filter(news => {
        if (tab !== 'all' && tab !== 'Principais' && news.category !== tab)
            return false;
        if (tab === 'Principais' && !news.isFeatured && news.trendingScore < 85)
            return false;
        if (source !== 'all' && news.source !== source) return false;
        if (limitDate && new Date(news.publishedAt) < limitDate) return false;
        if (normalizedQuery) {
            return (
                news.title.toLowerCase().includes(normalizedQuery) ||
                news.excerpt.toLowerCase().includes(normalizedQuery) ||
                news.tags.some((t: string) =>
                    t.toLowerCase().includes(normalizedQuery),
                )
            );
        }
        return true;
    });

    return filtered.sort((a, b) => {
        if (sort === 'most-read') return b.views - a.views;
        if (sort === 'trending') return b.trendingScore - a.trendingScore;
        return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        );
    });
};
