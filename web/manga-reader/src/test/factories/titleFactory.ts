import type { Title } from '@entities/manga/model/title.types';
import type { PageResponse } from '@shared/service/http';

import { buildChapterList } from './chapterFactory';
import { buildPage } from './pageFactory';

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
        adult: false,
        status: 'ongoing',
        author: 'Autor Teste',
        artist: 'Artista Teste',
        publisher: 'Publisher Teste',
        authors: [
            { authorId: 1, name: 'Autor Teste', slug: 'autor-teste', role: 'AUTHOR' },
            { authorId: 2, name: 'Artista Teste', slug: 'artista-teste', role: 'ARTIST' },
        ],
        publishers: [{ publisherId: 1, name: 'Publisher Teste', slug: 'publisher-teste' }],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
};

export const titlePresets = {
    manga: () => buildTitle({ type: 'MANGA' }),
    manhwa: () => buildTitle({ type: 'MANHWA' }),
    manhua: () => buildTitle({ type: 'MANHUA' }),

    ongoing: () => buildTitle({ status: 'ongoing' }),
    completed: () => buildTitle({ status: 'completed' }),
    hiatus: () => buildTitle({ status: 'hiatus' }),
    cancelled: () => buildTitle({ status: 'cancelled' }),

    adult: () => buildTitle({ adult: true, name: 'Conteudo Adulto' }),
    safe: () => buildTitle({ adult: false }),

    noChapters: () => buildTitle({ chapters: [] }),
    withFiftyChapters: () => buildTitle({ chapters: buildChapterList(50) }),

    unrated: () => buildTitle({ ratingAverage: 0, ratingCount: 0 }),
    perfectRating: () => buildTitle({ ratingAverage: 5, ratingCount: 9999 }),

    popularityHigh: () => buildTitle({ popularity: 'HIGH' }),
    popularityMedium: () => buildTitle({ popularity: 'MEDIUM' }),
    popularityLow: () => buildTitle({ popularity: 'LOW' }),

    noGenres: () => buildTitle({ genres: [] }),
    multiGenre: () =>
        buildTitle({
            genres: ['Action', 'Romance', 'Comedy', 'Drama', 'Fantasy'],
        }),
};

export const buildTitleList = (count = 10): Title[] => Array.from({ length: count }, () => buildTitle());

/**
 * Default mantem 2 items para compatibilidade com testes existentes
 * (useTitlesFetch, titleService) — usar buildTitleList(N) quando precisar mais.
 */
export const buildTitlePage = (titles: Title[] = [buildTitle(), buildTitle()], page = 0, size = 20): PageResponse<Title> => buildPage(titles, page, size);
