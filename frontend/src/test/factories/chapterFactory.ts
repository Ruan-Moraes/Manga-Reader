import type { Chapter } from '@feature/chapter';

let chapterCounter = 0;

export const buildChapter = (overrides: Partial<Chapter> = {}): Chapter => {
    chapterCounter += 1;

    return {
        number: String(chapterCounter),
        title: `Capitulo ${chapterCounter}`,
        releaseDate: '2026-01-15T10:00:00Z',
        pages: '20',
        ...overrides,
    };
};

export const chapterPresets = {
    first: () => buildChapter({ number: '1', title: 'Capitulo Inicial' }),
    fractional: () => buildChapter({ number: '12.5', title: 'Capitulo Bonus' }),
    longChapter: () => buildChapter({ pages: '120' }),
    shortChapter: () => buildChapter({ pages: '4' }),
    noPages: () => buildChapter({ pages: '0' }),
    releasedToday: () => buildChapter({ releaseDate: '2026-04-11T00:00:00Z' }),
    releasedLongAgo: () =>
        buildChapter({ releaseDate: '2018-03-21T00:00:00Z' }),
    upcoming: () => buildChapter({ releaseDate: '2027-12-31T00:00:00Z' }),
    untitled: () => buildChapter({ title: '' }),
    high: () => buildChapter({ number: '999', title: 'Capitulo Final' }),
};

export const buildChapterList = (count = 10): Chapter[] =>
    Array.from({ length: count }, (_, index) =>
        buildChapter({ number: String(index + 1) }),
    );
