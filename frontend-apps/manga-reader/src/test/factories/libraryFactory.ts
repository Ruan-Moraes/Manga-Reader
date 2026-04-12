import type {
    LibraryCounts,
    ReadingListType,
    SavedMangaItem,
    UserSavedLibrary,
} from '@feature/library/type/saved-library.types';

let savedMangaCounter = 0;

export const buildSavedMangaItem = (
    overrides: Partial<SavedMangaItem> = {},
): SavedMangaItem => {
    savedMangaCounter += 1;

    return {
        titleId: `title-${savedMangaCounter}`,
        name: `Manga Salvo ${savedMangaCounter}`,
        cover: `/covers/saved-${savedMangaCounter}.jpg`,
        type: 'MANGA',
        list: 'Lendo',
        savedAt: '2026-03-01T10:00:00Z',
        ...overrides,
    };
};

export const savedMangaPresets = {
    lendo: () => buildSavedMangaItem({ list: 'Lendo' }),
    queroLer: () => buildSavedMangaItem({ list: 'Quero Ler' }),
    concluido: () => buildSavedMangaItem({ list: 'Concluído' }),

    manhwa: () => buildSavedMangaItem({ type: 'MANHWA' }),
    manhua: () => buildSavedMangaItem({ type: 'MANHUA' }),

    recent: () => buildSavedMangaItem({ savedAt: '2026-04-10T10:00:00Z' }),
    old: () => buildSavedMangaItem({ savedAt: '2024-01-01T10:00:00Z' }),

    longName: () =>
        buildSavedMangaItem({
            name: 'Titulo extremamente longo para testar truncamento e overflow no UI',
        }),

    noCover: () => buildSavedMangaItem({ cover: '' }),
};

export const buildSavedMangaList = (count = 10): SavedMangaItem[] => {
    const lists: ReadingListType[] = ['Lendo', 'Quero Ler', 'Concluído'];
    return Array.from({ length: count }, (_, i) =>
        buildSavedMangaItem({ list: lists[i % 3] }),
    );
};

export const buildUserSavedLibrary = (
    overrides: Partial<UserSavedLibrary> = {},
): UserSavedLibrary => ({
    userId: 'user-1',
    name: 'Usuario Teste',
    savedMangas: buildSavedMangaList(),
    ...overrides,
});

export const userSavedLibraryPresets = {
    empty: () => buildUserSavedLibrary({ savedMangas: [] }),
    full: () => buildUserSavedLibrary({ savedMangas: buildSavedMangaList(50) }),
    onlyLendo: () =>
        buildUserSavedLibrary({
            savedMangas: Array.from({ length: 5 }, () =>
                buildSavedMangaItem({ list: 'Lendo' }),
            ),
        }),
};

export const buildLibraryCounts = (
    overrides: Partial<LibraryCounts> = {},
): LibraryCounts => ({
    lendo: 10,
    queroLer: 25,
    concluido: 12,
    total: 47,
    ...overrides,
});

export const libraryCountsPresets = {
    empty: (): LibraryCounts =>
        buildLibraryCounts({ lendo: 0, queroLer: 0, concluido: 0, total: 0 }),
    balanced: (): LibraryCounts =>
        buildLibraryCounts({
            lendo: 10,
            queroLer: 10,
            concluido: 10,
            total: 30,
        }),
    onlyLendo: (): LibraryCounts =>
        buildLibraryCounts({ lendo: 7, queroLer: 0, concluido: 0, total: 7 }),
    onlyConcluido: (): LibraryCounts =>
        buildLibraryCounts({
            lendo: 0,
            queroLer: 0,
            concluido: 100,
            total: 100,
        }),
    avidReader: (): LibraryCounts =>
        buildLibraryCounts({
            lendo: 50,
            queroLer: 200,
            concluido: 350,
            total: 600,
        }),
};
