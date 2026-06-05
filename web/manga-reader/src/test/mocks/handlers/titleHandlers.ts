import { http, HttpResponse } from 'msw';

import { buildTitlePage } from '../../factories/titleFactory';

export const titleHandlers = [
    http.get('*/api/titles', () =>
        HttpResponse.json({
            data: buildTitlePage(),
            success: true,
        }),
    ),

    http.get('*/api/titles/:id', ({ params }) =>
        HttpResponse.json({
            data: {
                id: params.id as string,
                type: 'MANGA',
                cover: '/covers/default.jpg',
                name: 'Título Mock',
                synopsis: 'Sinopse mock',
                genres: ['Action'],
                chapters: [],
                popularity: 'HIGH',
                ratingAverage: 4.5,
                ratingCount: 100,
                rankingScore: 85,
                author: 'Autor Mock',
                artist: 'Artista Mock',
                publisher: 'Publisher Mock',
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-01T00:00:00Z',
            },
            success: true,
        }),
    ),
];
