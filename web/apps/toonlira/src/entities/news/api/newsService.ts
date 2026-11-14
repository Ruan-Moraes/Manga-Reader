import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';
import { formatDate } from '@shared/lib/formatters';

import type { NewsItem, NewsQuery, NewsSummary } from '../model/news.types';

export const getNews = async (query: NewsQuery = { page: 0, size: 20 }): Promise<PageResponse<NewsSummary>> => {
    const response = await api.get<ApiResponse<PageResponse<NewsSummary>>>(API_URLS.NEWS, {
        params: { ...query, q: query.q || undefined, category: query.category || undefined },
    });
    return response.data.data;
};

export const getNewsById = async (idOrSlug: string): Promise<NewsItem> => {
    const response = await api.get<ApiResponse<NewsItem>>(`${API_URLS.NEWS}/${idOrSlug}`);
    return response.data.data;
};

export const getRelatedNews = async (idOrSlug: string, limit = 6): Promise<NewsSummary[]> => {
    const response = await api.get<ApiResponse<NewsSummary[]>>(`${API_URLS.NEWS}/${idOrSlug}/related`, { params: { limit } });
    return response.data.data;
};

export const buildTemporaryNewsCoverUrl = (slug: string): string =>
    `https://picsum.photos/seed/${encodeURIComponent(slug || 'noticia')}/1600/900`;

export { default as formatRelativeDate } from '@shared/service/util/formatRelativeDate';
export const formatNewsDate = (date: string) => formatDate(date, { dateStyle: 'full', timeStyle: 'short' });
