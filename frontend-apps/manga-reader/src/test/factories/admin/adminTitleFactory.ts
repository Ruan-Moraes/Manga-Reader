import type { AdminTitle } from '@feature/admin/type/admin.types';
import type { PageResponse } from '@shared/service/http';

import { buildPage } from '../pageFactory';

let adminTitleCounter = 0;

export const buildAdminTitle = (
    overrides: Partial<AdminTitle> = {},
): AdminTitle => {
    adminTitleCounter += 1;

    return {
        id: `admin-title-${adminTitleCounter}`,
        name: `Titulo Admin ${adminTitleCounter}`,
        type: 'MANGA',
        cover: `/covers/admin-title-${adminTitleCounter}.jpg`,
        synopsis: 'Sinopse do titulo administrado.',
        genres: ['Action'],
        status: 'ongoing',
        author: 'Autor Admin',
        artist: 'Artista Admin',
        publisher: 'Editora Admin',
        adult: false,
        ratingAverage: 4.2,
        ratingCount: 150,
        chaptersCount: 25,
        createdAt: '2025-08-01T10:00:00Z',
        updatedAt: '2026-03-15T10:00:00Z',
        ...overrides,
    };
};

export const adminTitlePresets = {
    manga: () => buildAdminTitle({ type: 'MANGA' }),
    manhwa: () => buildAdminTitle({ type: 'MANHWA' }),
    manhua: () => buildAdminTitle({ type: 'MANHUA' }),

    ongoing: () => buildAdminTitle({ status: 'ongoing' }),
    completed: () => buildAdminTitle({ status: 'completed' }),
    hiatus: () => buildAdminTitle({ status: 'hiatus' }),
    cancelled: () => buildAdminTitle({ status: 'cancelled' }),

    adult: () => buildAdminTitle({ adult: true }),
    safe: () => buildAdminTitle({ adult: false }),

    minimal: () =>
        buildAdminTitle({
            cover: null,
            synopsis: null,
            status: null,
            author: null,
            artist: null,
            publisher: null,
            ratingAverage: null,
            ratingCount: null,
            chaptersCount: 0,
        }),

    fullyPopulated: () =>
        buildAdminTitle({
            genres: ['Action', 'Romance', 'Comedy'],
            chaptersCount: 100,
            ratingAverage: 4.8,
            ratingCount: 5000,
        }),

    neverUpdated: () => buildAdminTitle({ updatedAt: null }),
};

export const buildAdminTitleList = (count = 10): AdminTitle[] =>
    Array.from({ length: count }, () => buildAdminTitle());

export const buildAdminTitlePage = (
    titles: AdminTitle[] = buildAdminTitleList(),
    page = 0,
    size = 20,
): PageResponse<AdminTitle> => buildPage(titles, page, size);
