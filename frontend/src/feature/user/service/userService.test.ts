import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import {
    getUserProfile,
    updateProfile,
    getEnrichedProfile,
    getMyEnrichedProfile,
    addRecommendation,
    removeRecommendation,
    reorderRecommendations,
    updatePrivacySettings,
    getUserComments,
    getUserHistory,
    recordView,
} from './userService';

const buildUser = (overrides = {}) => ({
    id: 'user-1',
    photo: 'photo.jpg',
    name: 'Test User',
    ...overrides,
});

const buildEnrichedProfile = (overrides = {}) => ({
    id: 'user-1',
    name: 'Test User',
    bio: 'Bio test',
    photoUrl: 'photo.jpg',
    bannerUrl: 'banner.jpg',
    role: 'MEMBER',
    socialLinks: [],
    createdAt: '2025-01-01T00:00:00Z',
    stats: {
        comments: 10,
        ratings: 5,
        libraryTotal: 20,
        lendo: 5,
        queroLer: 10,
        concluido: 5,
    },
    recommendations: [],
    recentComments: [],
    recentViewHistory: [],
    privacySettings: null,
    isOwner: false,
    ...overrides,
});

const buildPageResponse = (content: unknown[] = []) => ({
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
    last: true,
});

describe('userService', () => {
    describe('getUserProfile', () => {
        it('deve retornar perfil do usuario', async () => {
            server.use(
                http.get(`*${API_URLS.USERS}/user-1`, () =>
                    HttpResponse.json({ data: buildUser(), success: true }),
                ),
            );

            const result = await getUserProfile('user-1');

            expect(result.name).toBe('Test User');
        });
    });

    describe('updateProfile', () => {
        it('deve atualizar e retornar perfil', async () => {
            server.use(
                http.patch(`*${API_URLS.USERS}/me`, () =>
                    HttpResponse.json({
                        data: buildUser({ name: 'Updated' }),
                        success: true,
                    }),
                ),
            );

            const result = await updateProfile({ name: 'Updated' });

            expect(result.name).toBe('Updated');
        });
    });

    describe('getEnrichedProfile', () => {
        it('deve retornar perfil enriquecido', async () => {
            server.use(
                http.get(`*${API_URLS.USERS}/user-1/profile`, () =>
                    HttpResponse.json({
                        data: buildEnrichedProfile(),
                        success: true,
                    }),
                ),
            );

            const result = await getEnrichedProfile('user-1');

            expect(result.stats.comments).toBe(10);
        });
    });

    describe('getMyEnrichedProfile', () => {
        it('deve retornar meu perfil enriquecido', async () => {
            server.use(
                http.get(`*${API_URLS.USERS}/me/profile`, () =>
                    HttpResponse.json({
                        data: buildEnrichedProfile({ isOwner: true }),
                        success: true,
                    }),
                ),
            );

            const result = await getMyEnrichedProfile();

            expect(result.isOwner).toBe(true);
        });
    });

    describe('addRecommendation', () => {
        it('deve adicionar recomendacao', async () => {
            const rec = {
                titleId: 'title-1',
                titleName: 'One Piece',
                titleCover: 'cover.jpg',
                position: 0,
            };

            server.use(
                http.post(`*${API_URLS.USERS}/me/recommendations`, () =>
                    HttpResponse.json({ data: rec, success: true }),
                ),
            );

            const result = await addRecommendation('title-1');

            expect(result.titleName).toBe('One Piece');
        });
    });

    describe('removeRecommendation', () => {
        it('deve remover recomendacao sem erro', async () => {
            server.use(
                http.delete(
                    `*${API_URLS.USERS}/me/recommendations/title-1`,
                    () => new HttpResponse(null, { status: 204 }),
                ),
            );

            await expect(
                removeRecommendation('title-1'),
            ).resolves.toBeUndefined();
        });
    });

    describe('reorderRecommendations', () => {
        it('deve reordenar e retornar lista atualizada', async () => {
            const recs = [
                {
                    titleId: 't2',
                    titleName: 'B',
                    titleCover: 'b.jpg',
                    position: 0,
                },
                {
                    titleId: 't1',
                    titleName: 'A',
                    titleCover: 'a.jpg',
                    position: 1,
                },
            ];

            server.use(
                http.put(`*${API_URLS.USERS}/me/recommendations/order`, () =>
                    HttpResponse.json({ data: recs, success: true }),
                ),
            );

            const result = await reorderRecommendations(['t2', 't1']);

            expect(result[0].titleId).toBe('t2');
        });
    });

    describe('updatePrivacySettings', () => {
        it('deve atualizar configuracoes de privacidade', async () => {
            const settings = {
                commentVisibility: 'PUBLIC' as const,
                viewHistoryVisibility: 'PRIVATE' as const,
            };

            server.use(
                http.patch(`*${API_URLS.USERS}/me/privacy`, () =>
                    HttpResponse.json({ data: settings, success: true }),
                ),
            );

            const result = await updatePrivacySettings({
                viewHistoryVisibility: 'PRIVATE',
            });

            expect(result.viewHistoryVisibility).toBe('PRIVATE');
        });
    });

    describe('getUserComments', () => {
        it('deve retornar pagina de comentarios do usuario', async () => {
            const comments = [
                {
                    id: 'c1',
                    titleId: 't1',
                    textContent: 'Test',
                    createdAt: '2025-01-01',
                },
            ];

            server.use(
                http.get(`*${API_URLS.USERS}/user-1/comments`, () =>
                    HttpResponse.json({
                        data: buildPageResponse(comments),
                        success: true,
                    }),
                ),
            );

            const result = await getUserComments('user-1');

            expect(result.content).toHaveLength(1);
        });
    });

    describe('getUserHistory', () => {
        it('deve retornar pagina de historico', async () => {
            const history = [
                {
                    titleId: 't1',
                    titleName: 'A',
                    titleCover: 'a.jpg',
                    viewedAt: '2025-01-01',
                },
            ];

            server.use(
                http.get(`*${API_URLS.USERS}/user-1/history`, () =>
                    HttpResponse.json({
                        data: buildPageResponse(history),
                        success: true,
                    }),
                ),
            );

            const result = await getUserHistory('user-1');

            expect(result.content).toHaveLength(1);
        });
    });

    describe('recordView', () => {
        it('deve registrar visualizacao sem erro', async () => {
            server.use(
                http.post(
                    `*${API_URLS.USERS}/me/history`,
                    () => new HttpResponse(null, { status: 204 }),
                ),
            );

            await expect(recordView('title-1')).resolves.toBeUndefined();
        });
    });

    // ── Sad path (error) tests ──────────────────────────────────────────

    describe('getUserProfile — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.USERS}/user-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getUserProfile('user-1')).rejects.toThrow();
        });
    });

    describe('updateProfile — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.patch(`*${API_URLS.USERS}/me`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(updateProfile({ name: 'X' })).rejects.toThrow();
        });
    });

    describe('getEnrichedProfile — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.USERS}/user-1/profile`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getEnrichedProfile('user-1')).rejects.toThrow();
        });
    });

    describe('getMyEnrichedProfile — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.USERS}/me/profile`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getMyEnrichedProfile()).rejects.toThrow();
        });
    });

    describe('addRecommendation — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.post(`*${API_URLS.USERS}/me/recommendations`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(addRecommendation('title-1')).rejects.toThrow();
        });
    });

    describe('removeRecommendation — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.delete(
                    `*${API_URLS.USERS}/me/recommendations/title-1`,
                    () => HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(removeRecommendation('title-1')).rejects.toThrow();
        });
    });

    describe('reorderRecommendations — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.put(`*${API_URLS.USERS}/me/recommendations/order`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(
                reorderRecommendations(['t1', 't2']),
            ).rejects.toThrow();
        });
    });

    describe('updatePrivacySettings — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.patch(`*${API_URLS.USERS}/me/privacy`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(
                updatePrivacySettings({ viewHistoryVisibility: 'PRIVATE' }),
            ).rejects.toThrow();
        });
    });

    describe('getUserComments — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.USERS}/user-1/comments`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getUserComments('user-1')).rejects.toThrow();
        });
    });

    describe('getUserHistory — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.USERS}/user-1/history`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getUserHistory('user-1')).rejects.toThrow();
        });
    });

    describe('recordView — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.post(`*${API_URLS.USERS}/me/history`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(recordView('title-1')).rejects.toThrow();
        });
    });
});
