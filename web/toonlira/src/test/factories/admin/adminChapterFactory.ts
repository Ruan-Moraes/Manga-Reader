import type { AdminChapter, ChapterMetrics, ChapterPage } from '@entities/chapter';

let adminChapterCounter = 0;
let chapterPageCounter = 0;

export const buildAdminChapter = (overrides: Partial<AdminChapter> = {}): AdminChapter => {
    adminChapterCounter += 1;

    return {
        id: `admin-chapter-${adminChapterCounter}`,
        titleId: 'title-1',
        titleName: 'Obra de Teste',
        title: `Capítulo ${adminChapterCounter}`,
        number: String(adminChapterCounter),
        displayOrder: adminChapterCounter,
        description: null,
        status: 'published',
        pagesCount: 12,
        readyPagesCount: 12,
        publishedAt: '2026-03-10T12:00:00Z',
        scheduledAt: null,
        reads: 1200,
        completionRate: 0.72,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-10T12:00:00Z',
        createdBy: 'admin',
        updatedBy: null,
        deletedAt: null,
        ...overrides,
    };
};

export const adminChapterPresets = {
    draft: () => buildAdminChapter({ status: 'draft', pagesCount: 0, readyPagesCount: 0, publishedAt: null, reads: 0, completionRate: 0 }),
    scheduled: () => buildAdminChapter({ status: 'scheduled', publishedAt: null, scheduledAt: '2026-12-01T12:00:00Z', reads: 0 }),
    hidden: () => buildAdminChapter({ status: 'hidden' }),
    archived: () => buildAdminChapter({ status: 'archived' }),
    fractional: () => buildAdminChapter({ number: '12.5', title: 'Capítulo extra 12.5' }),
    deleted: () => buildAdminChapter({ deletedAt: '2026-04-01T10:00:00Z' }),
};

export const buildAdminChapterList = (count: number, overrides: Partial<AdminChapter> = {}): AdminChapter[] =>
    Array.from({ length: count }, () => buildAdminChapter(overrides));

export const buildChapterPage = (overrides: Partial<ChapterPage> = {}): ChapterPage => {
    chapterPageCounter += 1;

    return {
        id: `chapter-page-${chapterPageCounter}`,
        chapterId: 'admin-chapter-1',
        order: chapterPageCounter,
        originalFilename: `pagina-${chapterPageCounter}.jpg`,
        imageUrl: `https://picsum.photos/seed/test-${chapterPageCounter}/800/1200`,
        thumbnailUrl: `https://picsum.photos/seed/test-${chapterPageCounter}/200/300`,
        width: 800,
        height: 1200,
        fileSize: 320_000,
        format: 'jpg',
        processingStatus: 'ready',
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
        ...overrides,
    };
};

export const chapterPagePresets = {
    uploading: () => buildChapterPage({ processingStatus: 'uploading' }),
    processing: () => buildChapterPage({ processingStatus: 'processing' }),
    error: () => buildChapterPage({ processingStatus: 'error' }),
};

export const buildChapterMetrics = (overrides: Partial<ChapterMetrics> = {}): ChapterMetrics => ({
    chapterId: 'admin-chapter-1',
    totalReads: 15_000,
    uniqueReaders: 9_800,
    avgReadTimeSec: 420,
    completionRate: 0.78,
    avgReadPct: 0.85,
    abandonCount: 3_300,
    avgAbandonPage: 6,
    favoritesAfterRead: 410,
    readsByDevice: { mobile: 9_000, desktop: 4_500, tablet: 1_500 },
    readsByPlatform: { web: 8_000, android: 5_000, ios: 2_000 },
    vsPreviousChapter: { reads: 0.12, completionRate: 0.05 },
    vsTitleAverage: { reads: 0.08, completionRate: -0.02 },
    firstReadAt: '2026-03-10T12:30:00Z',
    lastReadAt: '2026-07-01T08:00:00Z',
    first24hReads: 2_400,
    first7dReads: 7_100,
    ...overrides,
});
