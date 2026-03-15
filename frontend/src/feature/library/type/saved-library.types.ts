export type ReadingListType = 'Lendo' | 'Quero Ler' | 'Concluído';

export type SavedMangaItem = {
    titleId: string;
    name: string;
    cover: string;
    type: string;
    list: ReadingListType;
    savedAt: string;
};

export type UserSavedLibrary = {
    userId: string;
    name: string;
    savedMangas: SavedMangaItem[];
};

export type LibraryCounts = {
    lendo: number;
    queroLer: number;
    concluido: number;
    total: number;
};
