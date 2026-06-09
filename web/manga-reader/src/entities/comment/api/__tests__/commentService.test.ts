import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import { getCommentsByTitleId, createComment, updateComment, deleteComment, likeComment, dislikeComment, getUserReactions } from '../commentService';

const buildCommentResponse = (overrides = {}) => ({
    id: 'comment-1',
    targetType: 'TITLE',
    targetId: 'title-1',
    parentCommentId: null,
    userId: 'user-1',
    userName: 'Test User',
    userPhoto: 'photo.jpg',
    isHighlighted: false,
    edited: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    textContent: 'Comentario de teste',
    imageContent: null,
    upvotes: 5,
    downvotes: 1,
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
            expect(result.content[0].likeCount).toBe('5');
            expect(result.content[0].dislikeCount).toBe('1');
        });

        it('deve propagar erro quando API falha', async () => {
            server.use(http.get(`*${API_URLS.COMMENTS}/title/title-1`, () => HttpResponse.json(null, { status: 500 })));

            await expect(getCommentsByTitleId('title-1')).rejects.toThrow();
        });
    });

    describe('createComment', () => {
        it('deve criar comentario e enviar targetType/targetId', async () => {
            const comment = buildCommentResponse({ textContent: 'Novo comentario' });

            server.use(
                http.post(`*${API_URLS.COMMENTS}`, async ({ request }) => {
                    const body = (await request.json()) as Record<string, unknown>;
                    expect(body.targetType).toBe('TITLE');
                    expect(body.targetId).toBe('title-1');
                    return HttpResponse.json({ data: comment, success: true });
                }),
            );

            const result = await createComment({ titleId: 'title-1', textContent: 'Novo comentario' });

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

            await createComment({ titleId: 'title-1', textContent: 'Resposta', parentCommentId: 'parent-1' });
        });

        it('deve lançar erro quando API retorna 500 no createComment', async () => {
            server.use(http.post(`*${API_URLS.COMMENTS}`, () => HttpResponse.json(null, { status: 500 })));

            await expect(createComment({ titleId: 'title-1', textContent: 'Novo comentario' })).rejects.toThrow();
        });
    });

    describe('updateComment', () => {
        it('deve atualizar comentario e retornar dados mapeados', async () => {
            const comment = buildCommentResponse({ textContent: 'Texto editado', edited: true });

            server.use(http.put(`*${API_URLS.COMMENTS}/comment-1`, () => HttpResponse.json({ data: comment, success: true })));

            const result = await updateComment('comment-1', 'Texto editado');

            expect(result.textContent).toBe('Texto editado');
            expect(result.edited).toBe(true);
        });

        it('deve lançar erro quando API retorna 500 no updateComment', async () => {
            server.use(http.put(`*${API_URLS.COMMENTS}/comment-1`, () => HttpResponse.json(null, { status: 500 })));

            await expect(updateComment('comment-1', 'Texto editado')).rejects.toThrow();
        });
    });

    describe('deleteComment', () => {
        it('deve deletar comentario sem erro', async () => {
            server.use(http.delete(`*${API_URLS.COMMENTS}/comment-1`, () => new HttpResponse(null, { status: 204 })));

            await expect(deleteComment('comment-1')).resolves.toBeUndefined();
        });

        it('deve lançar erro quando API retorna 500 no deleteComment', async () => {
            server.use(http.delete(`*${API_URLS.COMMENTS}/comment-1`, () => HttpResponse.json(null, { status: 500 })));

            await expect(deleteComment('comment-1')).rejects.toThrow();
        });
    });

    describe('likeComment', () => {
        it('deve votar up via /vote e retornar contadores', async () => {
            server.use(http.post(`*${API_URLS.COMMENTS}/comment-1/vote`, async ({ request }) => {
                const body = (await request.json()) as Record<string, unknown>;
                expect(body.value).toBe('up');
                return HttpResponse.json({ data: { upvotes: 6, downvotes: 1, myVote: 'up' }, success: true });
            }));

            const result = await likeComment('comment-1');

            expect(result.upvotes).toBe(6);
            expect(result.myVote).toBe('up');
        });

        it('deve lançar erro quando API retorna 500 no likeComment', async () => {
            server.use(http.post(`*${API_URLS.COMMENTS}/comment-1/vote`, () => HttpResponse.json(null, { status: 500 })));

            await expect(likeComment('comment-1')).rejects.toThrow();
        });
    });

    describe('dislikeComment', () => {
        it('deve votar down via /vote e retornar contadores', async () => {
            server.use(http.post(`*${API_URLS.COMMENTS}/comment-1/vote`, async ({ request }) => {
                const body = (await request.json()) as Record<string, unknown>;
                expect(body.value).toBe('down');
                return HttpResponse.json({ data: { upvotes: 5, downvotes: 2, myVote: 'down' }, success: true });
            }));

            const result = await dislikeComment('comment-1');

            expect(result.downvotes).toBe(2);
            expect(result.myVote).toBe('down');
        });

        it('deve lançar erro quando API retorna 500 no dislikeComment', async () => {
            server.use(http.post(`*${API_URLS.COMMENTS}/comment-1/vote`, () => HttpResponse.json(null, { status: 500 })));

            await expect(dislikeComment('comment-1')).rejects.toThrow();
        });
    });

    describe('getUserReactions', () => {
        it('deve traduzir votos up/down para LIKE/DISLIKE', async () => {
            const votes = { 'comment-1': 'up', 'comment-2': 'down' };

            server.use(http.get(`*${API_URLS.COMMENTS}/user-votes`, () => HttpResponse.json({ data: votes, success: true })));

            const result = await getUserReactions(['comment-1', 'comment-2']);

            expect(result['comment-1']).toBe('LIKE');
            expect(result['comment-2']).toBe('DISLIKE');
        });
    });
});
