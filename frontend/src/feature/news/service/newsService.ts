import { simulateDelay } from '@shared/service/mockApi';
import { mockNews } from '@mock/data/news';

import type { NewsCategory, NewsFilter, NewsItem } from '../type/news.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const periodInDays = { today: 1, week: 7, month: 30 } as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getNews = async (filters?: NewsFilter): Promise<NewsItem[]> => {
    await simulateDelay();

    if (!filters) return mockNews;

    const { tab, query, period, source, sort } = filters;
    const normalizedQuery = query.trim().toLowerCase();
    const now = Date.now();
    const limitDate =
        period === 'all'
            ? null
            : new Date(now - periodInDays[period] * 86_400_000);

    const filtered = mockNews.filter(news => {
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
                news.tags.some((t: string) => t.toLowerCase().includes(normalizedQuery))
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

export const getNewsById = (id: string): NewsItem | undefined =>
    mockNews.find(n => n.id === id);

export const getRelatedNews = (news: NewsItem, limit = 6): NewsItem[] =>
    mockNews
        .filter(
            item =>
                item.id !== news.id &&
                (item.category === news.category ||
                    item.tags.some((t: string) => news.tags.includes(t))),
        )
        .slice(0, limit);

export const getNewsSources = (): readonly string[] =>
    ['all', ...Array.from(new Set(mockNews.map(n => n.source)))] as const;

export const isNewsFresh = (publishedAt: string): boolean =>
    Date.now() - new Date(publishedAt).getTime() < 86_400_000;

export const formatRelativeDate = (date: string): string => {
    const diffInHours = Math.floor(
        (Date.now() - new Date(date).getTime()) / 3_600_000,
    );

    if (diffInHours < 1) return 'agora mesmo';
    if (diffInHours < 24)
        return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
};

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

export const filterNews = (filters: NewsFilter): NewsItem[] => {
    const { tab, query, period, source, sort } = filters;
    const normalizedQuery = query.trim().toLowerCase();
    const now = Date.now();
    const limitDate =
        period === 'all'
            ? null
            : new Date(now - periodInDays[period] * 86_400_000);

    const filtered = mockNews.filter(news => {
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
                news.tags.some((t: string) => t.toLowerCase().includes(normalizedQuery))
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
