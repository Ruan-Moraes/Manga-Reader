import type { AdminNews } from '@feature/admin/type/admin.types';
import type { PageResponse } from '@shared/service/http';

import { buildPage } from '../pageFactory';

let adminNewsCounter = 0;

export const buildAdminNews = (
    overrides: Partial<AdminNews> = {},
): AdminNews => {
    adminNewsCounter += 1;

    return {
        id: `admin-news-${adminNewsCounter}`,
        title: `Noticia Admin ${adminNewsCounter}`,
        subtitle: `Subtitulo ${adminNewsCounter}`,
        excerpt: 'Resumo da noticia.',
        coverImage: `/news/admin-${adminNewsCounter}.jpg`,
        category: 'Principais',
        tags: ['noticia', 'destaque'],
        authorName: 'Editor Admin',
        source: 'Manga Reader',
        readTime: 5,
        views: 1000,
        isExclusive: false,
        isFeatured: false,
        publishedAt: '2026-03-15T10:00:00Z',
        updatedAt: null,
        ...overrides,
    };
};

export const adminNewsPresets = {
    plain: () => buildAdminNews({ isExclusive: false, isFeatured: false }),
    exclusive: () => buildAdminNews({ isExclusive: true }),
    featured: () => buildAdminNews({ isFeatured: true }),
    breaking: () =>
        buildAdminNews({
            isExclusive: true,
            isFeatured: true,
            views: 100000,
        }),

    withoutAuthor: () => buildAdminNews({ authorName: null, source: null }),
    minimal: () =>
        buildAdminNews({
            subtitle: null,
            excerpt: null,
            coverImage: null,
            authorName: null,
            source: null,
            readTime: 0,
            views: 0,
            tags: [],
        }),

    noViews: () => buildAdminNews({ views: 0 }),
    millionViews: () => buildAdminNews({ views: 1_000_000 }),

    longRead: () => buildAdminNews({ readTime: 30 }),
    quickRead: () => buildAdminNews({ readTime: 1 }),

    edited: () => buildAdminNews({ updatedAt: '2026-03-20T10:00:00Z' }),
};

export const buildAdminNewsList = (count = 10): AdminNews[] =>
    Array.from({ length: count }, () => buildAdminNews());

export const buildAdminNewsPage = (
    items: AdminNews[] = buildAdminNewsList(),
    page = 0,
    size = 20,
): PageResponse<AdminNews> => buildPage(items, page, size);
