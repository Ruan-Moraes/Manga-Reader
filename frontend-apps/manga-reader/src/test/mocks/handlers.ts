import { http, HttpResponse } from 'msw';

import { buildAuthResponse } from '@/test/factories';

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
    wasEdited: false,
    createdAt: '2024-01-01T00:00:00Z',
    textContent: 'Great manga!',
    imageContent: null,
    likeCount: '0',
    dislikeCount: '0',
};

export const handlers = [
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

    http.get('*/api/titles/search', () => {
        return HttpResponse.json(wrapPage([mockTitle]));
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
        return HttpResponse.json(wrap({ ...mockComment, wasEdited: true }));
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
        return HttpResponse.json(
            wrap(
                'Sua solicitação foi enviada com sucesso! Entraremos em contato em breve.',
            ),
        );
    }),
];
