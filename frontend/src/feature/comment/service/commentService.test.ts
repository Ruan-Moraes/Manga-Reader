import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import {
    getCommentsByTitleId,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    dislikeComment,
    getUserReactions,
} from './commentService';

const buildCommentResponse = (overrides = {}) => ({
    id: 'comment-1',
    titleId: 'title-1',
    parentCommentId: null,
    userId: 'user-1',
    userName: 'Test User',
    userPhoto: 'photo.jpg',
    isHighlighted: false,
    wasEdited: false,
    createdAt: '2025-01-01T00:00:00Z',
    textContent: 'Comentario de teste',
    imageContent: null,
    likeCount: '5',
    dislikeCount: '1',
    ...overrides,
});

describe('commentService', () => {
    describe('getCommentsByTitleId', () => {
        it('deve retornar pagina de comentarios mapeados', async () => {
            const comments = [buildCommentResponse(), buildCommentResponse({ id: 'comment-2' })];

            server.use(
                http.get(`*${API_URLS.COMMENTS}/title/title-1`, () =>
                    HttpResponse.json({
                        data: {
                            content: comments,
                            page: 0,
                            size: 20,
                            totalElements: 2,
                            totalPages: 1,
                            last: true,
                        },
                        success: true,
                    }),
                ),
            );

            const result = await getCommentsByTitleId('title-1');

            expect(result.content).toHaveLength(2);
            expect(result.content[0].user.name).toBe('Test User');
            expect(result.content[0].isOwner).toBe(false);
        });

        it('deve propagar erro quando API falha', async () => {
            server.use(
                http.get(`*${API_URLS.COMMENTS}/title/title-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(getCommentsByTitleId('title-1')).rejects.toThrow();
        });
    });

    describe('createComment', () => {
        it('deve criar comentario e retornar dados mapeados', async () => {
            const comment = buildCommentResponse({ textContent: 'Novo comentario' });

            server.use(
                http.post(`*${API_URLS.COMMENTS}`, () =>
                    HttpResponse.json({ data: comment, success: true }),
                ),
            );

            const result = await createComment({
                titleId: 'title-1',
                textContent: 'Novo comentario',
            });

            expect(result.textContent).toBe('Novo comentario');
            expect(result.user.id).toBe('user-1');
        });

        it('deve enviar parentCommentId quando fornecido', async () => {
            const comment = buildCommentResponse({ parentCommentId: 'parent-1' });

            server.use(
                http.post(`*${API_URLS.COMMENTS}`, async ({ request }) => {
                    const body = (await request.json()) as Record<string, unknown>;
                    expect(body.parentCommentId).toBe('parent-1');
                    return HttpResponse.json({ data: comment, success: true });
                }),
            );

            await createComment({
                titleId: 'title-1',
                textContent: 'Resposta',
                parentCommentId: 'parent-1',
            });
        });

        it('deve lançar erro quando API retorna 500 no createComment', async () => {
            server.use(
                http.post(`*${API_URLS.COMMENTS}`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(
                createComment({
                    titleId: 'title-1',
                    textContent: 'Novo comentario',
                }),
            ).rejects.toThrow();
        });
    });

    describe('updateComment', () => {
        it('deve atualizar comentario e retornar dados mapeados', async () => {
            const comment = buildCommentResponse({
                textContent: 'Texto editado',
                wasEdited: true,
            });

            server.use(
                http.put(`*${API_URLS.COMMENTS}/comment-1`, () =>
                    HttpResponse.json({ data: comment, success: true }),
                ),
            );

            const result = await updateComment('comment-1', 'Texto editado');

            expect(result.textContent).toBe('Texto editado');
            expect(result.wasEdited).toBe(true);
        });

        it('deve lançar erro quando API retorna 500 no updateComment', async () => {
            server.use(
                http.put(`*${API_URLS.COMMENTS}/comment-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(
                updateComment('comment-1', 'Texto editado'),
            ).rejects.toThrow();
        });
    });

    describe('deleteComment', () => {
        it('deve deletar comentario sem erro', async () => {
            server.use(
                http.delete(`*${API_URLS.COMMENTS}/comment-1`, () =>
                    new HttpResponse(null, { status: 204 }),
                ),
            );

            await expect(deleteComment('comment-1')).resolves.toBeUndefined();
        });

        it('deve lançar erro quando API retorna 500 no deleteComment', async () => {
            server.use(
                http.delete(`*${API_URLS.COMMENTS}/comment-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(deleteComment('comment-1')).rejects.toThrow();
        });
    });

    describe('likeComment', () => {
        it('deve dar like e retornar comentario atualizado', async () => {
            const comment = buildCommentResponse({ likeCount: '6' });

            server.use(
                http.post(`*${API_URLS.COMMENTS}/comment-1/like`, () =>
                    HttpResponse.json({ data: comment, success: true }),
                ),
            );

            const result = await likeComment('comment-1');

            expect(result.likeCount).toBe('6');
        });

        it('deve lançar erro quando API retorna 500 no likeComment', async () => {
            server.use(
                http.post(`*${API_URLS.COMMENTS}/comment-1/like`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(likeComment('comment-1')).rejects.toThrow();
        });
    });

    describe('dislikeComment', () => {
        it('deve dar dislike e retornar comentario atualizado', async () => {
            const comment = buildCommentResponse({ dislikeCount: '2' });

            server.use(
                http.post(`*${API_URLS.COMMENTS}/comment-1/dislike`, () =>
                    HttpResponse.json({ data: comment, success: true }),
                ),
            );

            const result = await dislikeComment('comment-1');

            expect(result.dislikeCount).toBe('2');
        });

        it('deve lançar erro quando API retorna 500 no dislikeComment', async () => {
            server.use(
                http.post(`*${API_URLS.COMMENTS}/comment-1/dislike`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(dislikeComment('comment-1')).rejects.toThrow();
        });
    });

    describe('getUserReactions', () => {
        it('deve retornar mapa de reacoes do usuario', async () => {
            const reactions = { 'comment-1': 'LIKE', 'comment-2': 'DISLIKE' };

            server.use(
                http.get(`*${API_URLS.COMMENTS}/user-reactions`, () =>
                    HttpResponse.json({ data: reactions, success: true }),
                ),
            );

            const result = await getUserReactions(['comment-1', 'comment-2']);

            expect(result['comment-1']).toBe('LIKE');
            expect(result['comment-2']).toBe('DISLIKE');
        });
    });
});
