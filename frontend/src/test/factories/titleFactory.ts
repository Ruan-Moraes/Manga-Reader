import type { Title } from '@feature/manga/type/title.types';
import type { PageResponse } from '@shared/service/http';

let titleCounter = 0;

export const buildTitle = (overrides: Partial<Title> = {}): Title => {
    titleCounter += 1;

    return {
        id: `title-${titleCounter}`,
        type: 'MANGA',
        cover: '/covers/default.jpg',
        name: `Titulo de Teste ${titleCounter}`,
        synopsis: 'Sinopse de teste para o titulo.',
        genres: ['Action', 'Adventure'],
        chapters: [],
        popularity: 'HIGH',
        ratingAverage: 4.5,
        ratingCount: 100,
        rankingScore: 85,
        author: 'Autor Teste',
        artist: 'Artista Teste',
        publisher: 'Publisher Teste',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
};

export const buildTitlePage = (
    titles: Title[] = [buildTitle(), buildTitle()],
    page = 0,
): PageResponse<Title> => ({
    content: titles,
    page,
    size: 20,
    totalElements: titles.length,
    totalPages: 1,
    last: true,
});
