import { http, HttpResponse } from 'msw';

import { buildAuthResponse } from '@/test/factories';
import { createChapterStore } from '@entities/chapter/api/admin/localStorageChapterStore';
import { createLocalStorageChapterAdminGateway } from '@entities/chapter/api/admin/localStorageChapterAdminGateway';
import { createLocalStorageChapterAnalyticsGateway } from '@entities/chapter/api/admin/localStorageChapterAnalyticsGateway';
import { createLocalStorageChapterPublicGateway } from '@entities/chapter/api/admin/localStorageChapterPublicGateway';
import type { ChapterMetricsFilter, ChapterStatus, CreateChapterRequest, MetricsGranularity, UpdateChapterRequest } from '@entities/chapter';

const wrap = <T>(data: T) => ({ data, success: true });

const wrapPage = <T>(content: T[], page = 0, size = 20) => ({
    data: {
        content,
        page,
        size,
        totalElements: content.length,
        totalPages: 1,
        last: true,
    },
    success: true,
});

// Backend determinístico exclusivo da suíte: os componentes exercitam o
// gateway HTTP real; o estado em memória/localStorage apenas materializa as
// respostas do MSW e nunca é selecionado pelo código de produção.
const chapterTestStore = createChapterStore({ latencyMs: 0, processingStepMs: 0 });
const chapterTestGateway = createLocalStorageChapterAdminGateway(chapterTestStore);
const chapterTestAnalyticsGateway = createLocalStorageChapterAnalyticsGateway(chapterTestStore);
const chapterTestPublicGateway = createLocalStorageChapterPublicGateway(chapterTestStore);
const chapterToApi = <T extends { status: ChapterStatus }>(chapter: T) => ({ ...chapter, status: chapter.status.toUpperCase() });
const statusFromApi = (status?: string) => status?.toLowerCase() as ChapterStatus | undefined;
const analyticsFilter = (request: Request, chapterId?: string): ChapterMetricsFilter => {
    const params = new URL(request.url).searchParams;
    return {
        chapterId,
        from: params.get('from')?.slice(0, 10),
        to: params.get('to')?.slice(0, 10),
        device: (params.get('device') ?? undefined) as ChapterMetricsFilter['device'],
        platform: (params.get('platform') ?? undefined) as ChapterMetricsFilter['platform'],
    };
};

// Pin valores conhecidos por testes existentes (useAuth.test, etc).
// Internamente delega ao factory para garantir shape correto.
export const mockAuthResponse = buildAuthResponse({
    accessToken: 'fake-access-token',
    refreshToken: 'fake-refresh-token',
    userId: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'MEMBER',
    photoUrl: 'https://example.com/photo.jpg',
});

export const mockTitle = {
    id: 'title-1',
    name: 'One Piece',
    alternativeNames: [],
    author: 'Oda',
    artist: 'Oda',
    type: 'MANGA',
    status: 'ONGOING',
    synopsis: 'A pirate adventure',
    coverImage: 'https://example.com/cover.jpg',
    genres: ['Action'],
    tags: [],
    chapters: [],
    views: 1000,
    rating: 4.5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

export const mockLibraryEntry = {
    id: 'lib-1',
    titleId: 'title-1',
    titleName: 'One Piece',
    titleCover: 'https://example.com/cover.jpg',
    titleType: 'MANGA',
    list: 'Quero Ler',
    addedAt: '2024-01-01T00:00:00Z',
};

export const mockComment = {
    id: 'comment-1',
    titleId: 'title-1',
    parentCommentId: null,
    userId: 'user-1',
    userName: 'Test User',
    userPhoto: 'https://example.com/photo.jpg',
    isHighlighted: false,
    edited: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    textContent: 'Great manga!',
    imageContent: null,
    likeCount: '0',
    dislikeCount: '0',
};

export const handlers = [
    http.get('*/api/titles/:titleId/chapters/:number/reader', async ({ params, request }) => {
        const preview = new URL(request.url).searchParams.get('preview') === 'true';
        const chapter = await chapterTestPublicGateway.getReaderChapter(
            String(params.titleId), String(params.number), { includeUnpublished: preview });
        if (!chapter || chapter === 'blocked') return HttpResponse.json({ success: false }, { status: 404 });
        return HttpResponse.json(wrap({ ...chapter, status: chapter.status.toUpperCase() }));
    }),

    http.get('*/api/titles/:titleId/chapters/:number', async ({ params }) => {
        const chapter = await chapterTestPublicGateway.getReaderChapter(String(params.titleId), String(params.number), { includeUnpublished: true });
        if (!chapter || chapter === 'blocked') return HttpResponse.json({ success: false }, { status: 404 });
        return HttpResponse.json(wrap({ id: chapter.id, number: chapter.number, title: chapter.title, releaseDate: null, pages: String(chapter.pages.length) }));
    }),

    // Rotas literais devem preceder /api/titles/:id no MSW; caso contrário
    // "search" é interpretado como um id e o shape deixa de ser paginado.
    http.get('*/api/titles/search', () => {
        return HttpResponse.json(wrapPage([mockTitle]));
    }),

    http.get('*/api/titles/:id', ({ params }) => HttpResponse.json(wrap({
        ...mockTitle,
        id: String(params.id),
        name: `Título ${String(params.id)}`,
        chaptersCount: 20,
        latestChapterNumber: '20',
        ratingAverage: 4.5,
        ratingCount: 100,
    }))),

    http.get('*/api/admin/chapters', async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const statuses = params.getAll('status').map(value => value.toLowerCase() as ChapterStatus);
        const result = await chapterTestGateway.list({
            page: Number(params.get('page') ?? 0),
            size: Number(params.get('size') ?? 20),
            sort: (params.get('sort') ?? 'number') as 'number' | 'publishedAt' | 'updatedAt' | 'reads',
            direction: (params.get('direction') ?? 'asc') as 'asc' | 'desc',
            search: params.get('search') ?? undefined,
            titleId: params.get('titleId') ?? undefined,
            status: statuses.length ? statuses : undefined,
            includeDeleted: params.get('includeDeleted') === 'true',
        });
        return HttpResponse.json(wrap({ ...result, content: result.content.map(chapterToApi) }));
    }),

    http.get('*/api/admin/chapters/:id', async ({ params }) => {
        const chapter = await chapterTestGateway.getById(String(params.id));
        return HttpResponse.json(wrap(chapterToApi(chapter)));
    }),

    http.post('*/api/admin/chapters', async ({ request }) => {
        const body = await request.json() as CreateChapterRequest & { status?: string };
        const chapter = await chapterTestGateway.create({ ...body, status: statusFromApi(body.status) as CreateChapterRequest['status'] });
        return HttpResponse.json(wrap(chapterToApi(chapter)));
    }),

    http.patch('*/api/admin/chapters/:id', async ({ params, request }) => {
        const body = await request.json() as UpdateChapterRequest;
        const chapter = await chapterTestGateway.update(String(params.id), body);
        return HttpResponse.json(wrap(chapterToApi(chapter)));
    }),

    http.post('*/api/admin/chapters/:id/status', async ({ params, request }) => {
        const body = await request.json() as { status: string; scheduledAt?: string };
        const chapter = await chapterTestGateway.changeStatus(String(params.id), statusFromApi(body.status)!, body);
        return HttpResponse.json(wrap(chapterToApi(chapter)));
    }),

    http.post('*/api/admin/chapters/:id/duplicate', async ({ params }) => {
        const chapter = await chapterTestGateway.duplicate(String(params.id));
        return HttpResponse.json(wrap(chapterToApi(chapter)));
    }),

    http.delete('*/api/admin/chapters/:id', async ({ params }) => {
        await chapterTestGateway.softDelete(String(params.id));
        return new HttpResponse(null, { status: 204 });
    }),

    http.get('*/api/admin/chapter-analytics/:id', async ({ params, request }) => {
        const id = String(params.id);
        return HttpResponse.json(wrap(await chapterTestAnalyticsGateway.getChapterMetrics(id, analyticsFilter(request, id))));
    }),

    http.get('*/api/admin/chapter-analytics/:id/series', async ({ params, request }) => {
        const id = String(params.id);
        const granularity = (new URL(request.url).searchParams.get('granularity') ?? 'day') as MetricsGranularity;
        return HttpResponse.json(wrap(await chapterTestAnalyticsGateway.getReadsSeries(analyticsFilter(request, id), granularity)));
    }),

    http.get('*/api/auth/me', () => {
        return HttpResponse.json(wrap(mockAuthResponse));
    }),

    http.post('*/api/auth/sign-in', () => {
        return HttpResponse.json(wrap(mockAuthResponse));
    }),

    http.post('*/api/auth/sign-up', () => {
        return HttpResponse.json(wrap(mockAuthResponse));
    }),

    http.post('*/api/auth/sign-out', () => {
        return new HttpResponse(null, { status: 204 });
    }),

    http.get('*/api/behavior-events/config', () => HttpResponse.json(wrap({
        enabled: true,
        titleViewSeconds: 15,
        bounceMinSeconds: 2,
        chapterStartSeconds: 10,
        chapterCompletionPercent: 90,
        maxBatchSize: 100,
    }))),

    http.post('*/api/behavior-events/batch', async ({ request }) => {
        const body = await request.json() as { events: { eventId: string }[] };
        return HttpResponse.json(wrap({ acceptedEventIds: body.events.map(event => event.eventId) }), { status: 202 });
    }),

    http.get('*/api/library', () => {
        return HttpResponse.json(wrapPage([mockLibraryEntry]));
    }),

    http.post('*/api/library', () => {
        return HttpResponse.json(wrap(mockLibraryEntry), { status: 201 });
    }),

    http.delete('*/api/library/:titleId', () => {
        return new HttpResponse(null, { status: 204 });
    }),

    http.delete('*/api/comments/:id', () => {
        return new HttpResponse(null, { status: 204 });
    }),

    http.put('*/api/comments/:id', () => {
        return HttpResponse.json(wrap({ ...mockComment, edited: true }));
    }),

    http.post('*/api/comments', () => {
        return HttpResponse.json(
            wrap({
                ...mockComment,
                id: 'comment-reply-1',
                parentCommentId: 'comment-1',
            }),
        );
    }),

    http.post('*/api/contact/publish-work', () => {
        return HttpResponse.json(wrap('Sua solicitação foi enviada com sucesso! Entraremos em contato em breve.'));
    }),

    http.post('*/api/users/me/history', () => {
        return new HttpResponse(null, { status: 204 });
    }),

    http.put('*/api/users/me/reading-progress', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(wrap({ ...body, updatedAt: '2024-01-01T00:00:00Z' }));
    }),

    http.get('*/api/users/me/reading-progress/:titleId', () => {
        return HttpResponse.json(wrap(null));
    }),
];
