import { describe, it, expect, vi, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import type { ForumTopic } from '../type/forum.types';

import {
    getForumTopics,
    getForumTopicById,
    getForumCategories,
    filterForumTopics,
    getCategoryColor,
    paginateTopics,
    formatRelativeDate,
    TOPICS_PER_PAGE,
} from './forumService';

const buildTopic = (overrides: Partial<ForumTopic> = {}): ForumTopic => ({
    id: 'topic-1',
    title: 'Topico de teste',
    content: 'Conteudo do topico',
    category: 'Geral',
    tags: ['manga'],
    author: { id: 'u1', name: 'User', avatar: 'avatar.jpg', role: 'member' },
    createdAt: '2025-01-01T00:00:00Z',
    lastActivityAt: '2025-01-02T00:00:00Z',
    replyCount: 5,
    likeCount: 10,
    viewCount: 100,
    isPinned: false,
    isSolved: false,
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

describe('forumService', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getForumTopics', () => {
        it('deve retornar pagina de topicos', async () => {
            server.use(
                http.get(`*${API_URLS.FORUM}`, () =>
                    HttpResponse.json({
                        data: buildPageResponse([buildTopic()]),
                        success: true,
                    }),
                ),
            );

            const result = await getForumTopics();

            expect(result.content).toHaveLength(1);
        });
    });

    describe('getForumTopicById', () => {
        it('deve retornar topico pelo id', async () => {
            server.use(
                http.get(`*${API_URLS.FORUM}/topic-1`, () =>
                    HttpResponse.json({ data: buildTopic(), success: true }),
                ),
            );

            const result = await getForumTopicById('topic-1');

            expect(result.title).toBe('Topico de teste');
        });
    });

    describe('getForumCategories', () => {
        it('deve retornar lista de categorias', async () => {
            const categories = ['Geral', 'Suporte'];

            server.use(
                http.get(`*${API_URLS.FORUM}/categories`, () =>
                    HttpResponse.json({ data: categories, success: true }),
                ),
            );

            const result = await getForumCategories();

            expect(result).toEqual(categories);
        });
    });

    describe('filterForumTopics', () => {
        it('deve filtrar por categoria', () => {
            const topics = [
                buildTopic({ category: 'Geral' }),
                buildTopic({ id: 't2', category: 'Suporte' }),
            ];

            const result = filterForumTopics(topics, { category: 'Geral' });

            expect(result).toHaveLength(1);
            expect(result[0].category).toBe('Geral');
        });

        it('deve filtrar por query no titulo', () => {
            const topics = [
                buildTopic({ title: 'One Piece e incrivel' }),
                buildTopic({ id: 't2', title: 'Naruto discussion' }),
            ];

            const result = filterForumTopics(topics, { query: 'one piece' });

            expect(result).toHaveLength(1);
        });

        it('deve filtrar apenas pinados quando onlyPinned', () => {
            const topics = [
                buildTopic({ isPinned: true }),
                buildTopic({ id: 't2', isPinned: false }),
            ];

            const result = filterForumTopics(topics, { onlyPinned: true });

            expect(result).toHaveLength(1);
            expect(result[0].isPinned).toBe(true);
        });

        it('deve ordenar por popularidade', () => {
            const topics = [
                buildTopic({ id: 't1', likeCount: 5, isPinned: false }),
                buildTopic({ id: 't2', likeCount: 20, isPinned: false }),
            ];

            const result = filterForumTopics(topics, { sort: 'popular' });

            expect(result[0].id).toBe('t2');
        });

        it('deve manter pinados no topo independente da ordenacao', () => {
            const topics = [
                buildTopic({ id: 't1', likeCount: 100, isPinned: false }),
                buildTopic({ id: 't2', likeCount: 1, isPinned: true }),
            ];

            const result = filterForumTopics(topics, { sort: 'popular' });

            expect(result[0].id).toBe('t2');
        });
    });

    describe('getCategoryColor', () => {
        it('deve retornar classes CSS para cada categoria', () => {
            expect(getCategoryColor('Geral')).toContain('blue');
            expect(getCategoryColor('Spoilers')).toContain('red');
            expect(getCategoryColor('Fanart')).toContain('pink');
        });
    });

    describe('paginateTopics', () => {
        it('deve paginar corretamente', () => {
            const topics = Array.from({ length: 20 }, (_, i) =>
                buildTopic({ id: `t-${i}` }),
            );

            const page1 = paginateTopics(topics, 1);

            expect(page1.items).toHaveLength(TOPICS_PER_PAGE);
            expect(page1.totalPages).toBe(3);
        });

        it('deve retornar totalPages = 1 para lista vazia', () => {
            const result = paginateTopics([], 1);

            expect(result.totalPages).toBe(1);
            expect(result.items).toHaveLength(0);
        });
    });

    describe('formatRelativeDate', () => {
        it('deve retornar "agora mesmo" para menos de 1 minuto', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

            expect(formatRelativeDate('2025-06-15T11:59:50Z')).toBe(
                'agora mesmo',
            );
        });

        it('deve retornar minutos para menos de 1 hora', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

            expect(formatRelativeDate('2025-06-15T11:30:00Z')).toBe(
                'há 30 min',
            );
        });

        it('deve retornar meses para mais de 30 dias', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

            expect(formatRelativeDate('2025-03-15T12:00:00Z')).toContain(
                'meses',
            );
        });
    });
});
