import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';

import { API_URLS } from '@shared/constant/API_URLS';

import type { NewsItem } from '@entities/news';

import { buildTemporaryNewsCoverUrl, getNews, getNewsById, getRelatedNews, formatNewsDate } from '../newsService';

const buildNewsItem = (overrides: Partial<NewsItem> = {}): NewsItem => ({
    id: 'news-1',
    title: 'Nova noticia',
    subtitle: 'Subtitulo da noticia',
    excerpt: 'Resumo da noticia',
    content: ['Conteudo completo'],
    coverImage: 'cover.jpg',
    gallery: [],
    category: 'Lançamentos',
    tags: ['manga', 'anime'],
    source: 'MangaPlus',
    sourceLogo: 'mangaplus.png',
    readTime: 5,
    commentsCount: 0,
    author: {
        id: 'author-1',
        name: 'Editor',
        avatar: 'avatar.jpg',
        role: 'editor',
        profileLink: '/users/author-1',
    },
    publishedAt: '2025-06-15T10:00:00Z',
    views: 1000,
    trendingScore: 90,
    isFeatured: false,
    reactions: { like: 0, excited: 0, sad: 0, surprised: 0 },
    comments: [],
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

        it('envia paginação, pesquisa, categoria, período e ordenação para a API', async () => {
            let receivedParams: URLSearchParams | undefined;
            server.use(
                http.get(`*${API_URLS.NEWS}`, ({ request }) => {
                    receivedParams = new URL(request.url).searchParams;
                    return HttpResponse.json({ data: buildPageResponse(), success: true });
                }),
            );

            await getNews({ page: 2, size: 12, q: 'one piece', category: 'Lançamentos', period: 'week', sort: 'trending' });

            expect(Object.fromEntries(receivedParams ?? [])).toMatchObject({
                page: '2', size: '12', q: 'one piece', category: 'Lançamentos', period: 'week', sort: 'trending',
            });
        });
    });

    describe('getNewsById', () => {
        it('deve retornar noticia pelo id', async () => {
            server.use(http.get(`*${API_URLS.NEWS}/news-1`, () => HttpResponse.json({ data: buildNewsItem(), success: true })));

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
            server.use(http.get(`*${API_URLS.NEWS}`, () => HttpResponse.json(null, { status: 500 })));
            await expect(getNews()).rejects.toThrow();
        });
    });

    describe('getNewsById — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(http.get(`*${API_URLS.NEWS}/news-1`, () => HttpResponse.json(null, { status: 500 })));
            await expect(getNewsById('news-1')).rejects.toThrow();
        });
    });

    describe('getRelatedNews — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(http.get(`*${API_URLS.NEWS}/news-1/related`, () => HttpResponse.json(null, { status: 500 })));
            await expect(getRelatedNews('news-1')).rejects.toThrow();
        });
    });

    describe('formatNewsDate', () => {
        it('deve formatar data em portugues', () => {
            const result = formatNewsDate('2025-06-15T10:00:00Z');

            expect(result.toLowerCase()).toContain('junho');
        });
    });

    describe('buildTemporaryNewsCoverUrl', () => {
        it('gera uma URL Picsum determinística e segura para o slug', () => {
            expect(buildTemporaryNewsCoverUrl('one piece/2026')).toBe(
                'https://picsum.photos/seed/one%20piece%2F2026/1600/900',
            );
            expect(buildTemporaryNewsCoverUrl('one piece/2026')).toBe(buildTemporaryNewsCoverUrl('one piece/2026'));
        });
    });
});
