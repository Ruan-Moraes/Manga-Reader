import { describe, it, expect, vi, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import type { NewsItem } from '../type/news.types';

import {
    getNews,
    getNewsById,
    getRelatedNews,
    isNewsFresh,
    formatNewsDate,
    filterNews,
} from './newsService';

const buildNewsItem = (overrides: Partial<NewsItem> = {}): NewsItem => ({
    id: 'news-1',
    title: 'Nova noticia',
    excerpt: 'Resumo da noticia',
    content: 'Conteudo completo',
    cover: 'cover.jpg',
    category: 'Lançamentos',
    tags: ['manga', 'anime'],
    source: 'MangaPlus',
    author: { name: 'Editor', avatar: 'avatar.jpg' },
    publishedAt: '2025-06-15T10:00:00Z',
    views: 1000,
    trendingScore: 90,
    isFeatured: false,
    ...overrides,
});

const buildPageResponse = (content: unknown[] = []) => ({
    content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    last: true,
});

describe('newsService', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getNews', () => {
        it('deve retornar pagina de noticias', async () => {
            server.use(
                http.get(`*${API_URLS.NEWS}`, () =>
                    HttpResponse.json({
                        data: buildPageResponse([buildNewsItem()]),
                        success: true,
                    }),
                ),
            );

            const result = await getNews();

            expect(result.content).toHaveLength(1);
        });
    });

    describe('getNewsById', () => {
        it('deve retornar noticia pelo id', async () => {
            server.use(
                http.get(`*${API_URLS.NEWS}/news-1`, () =>
                    HttpResponse.json({ data: buildNewsItem(), success: true }),
                ),
            );

            const result = await getNewsById('news-1');

            expect(result.title).toBe('Nova noticia');
        });
    });

    describe('getRelatedNews', () => {
        it('deve retornar noticias relacionadas', async () => {
            server.use(
                http.get(`*${API_URLS.NEWS}/news-1/related`, () =>
                    HttpResponse.json({
                        data: [buildNewsItem({ id: 'news-2' })],
                        success: true,
                    }),
                ),
            );

            const result = await getRelatedNews('news-1');

            expect(result).toHaveLength(1);
        });
    });

    describe('getNews — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.NEWS}`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getNews()).rejects.toThrow();
        });
    });

    describe('getNewsById — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.NEWS}/news-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getNewsById('news-1')).rejects.toThrow();
        });
    });

    describe('getRelatedNews — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.NEWS}/news-1/related`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getRelatedNews('news-1')).rejects.toThrow();
        });
    });

    describe('isNewsFresh', () => {
        it('deve retornar true para noticia de menos de 24h', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

            expect(isNewsFresh('2025-06-15T10:00:00Z')).toBe(true);
        });

        it('deve retornar false para noticia de mais de 24h', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-06-17T12:00:00Z'));

            expect(isNewsFresh('2025-06-15T10:00:00Z')).toBe(false);
        });
    });

    describe('formatNewsDate', () => {
        it('deve formatar data em portugues', () => {
            const result = formatNewsDate('2025-06-15T10:00:00Z');

            expect(result.toLowerCase()).toContain('junho');
        });
    });

    describe('filterNews', () => {
        it('deve filtrar por categoria', () => {
            const items = [
                buildNewsItem({ category: 'Lançamentos' }),
                buildNewsItem({ id: 'n2', category: 'Indústria' }),
            ];

            const result = filterNews(items, {
                tab: 'Lançamentos',
                query: '',
                period: 'all',
                source: 'all',
                sort: 'recent',
            });

            expect(result).toHaveLength(1);
        });

        it('deve filtrar por query no titulo', () => {
            const items = [
                buildNewsItem({ title: 'One Piece capitulo novo' }),
                buildNewsItem({ id: 'n2', title: 'Naruto remake' }),
            ];

            const result = filterNews(items, {
                tab: 'all',
                query: 'one piece',
                period: 'all',
                source: 'all',
                sort: 'recent',
            });

            expect(result).toHaveLength(1);
        });

        it('deve ordenar por mais lidos', () => {
            const items = [
                buildNewsItem({ id: 'n1', views: 100 }),
                buildNewsItem({ id: 'n2', views: 500 }),
            ];

            const result = filterNews(items, {
                tab: 'all',
                query: '',
                period: 'all',
                source: 'all',
                sort: 'most-read',
            });

            expect(result[0].id).toBe('n2');
        });
    });
});
