import type { LocalizedString } from '@shared/type/i18n';

/** Autor relacionado a um título, com papel (role). */
export type TitleAuthorRef = {
    authorId: number;
    authorName?: string | null;
    role: string;
};

/** Editora relacionada a um título. */
export type TitlePublisherRef = {
    id: number;
    name?: string | null;
};

export type AdminTitle = {
    id: string;
    name: LocalizedString;
    type: string;
    cover: string | null;
    synopsis: LocalizedString;
    genres: string[];
    status: string | null;
    /** @deprecated campo string legado — preferir `authors`. */
    author: string | null;
    /** @deprecated campo string legado. */
    artist: string | null;
    /** @deprecated campo string legado — preferir `publishers`. */
    publisher: string | null;
    authors?: TitleAuthorRef[];
    publishers?: TitlePublisherRef[];
    adult: boolean;
    ratingAverage: number | null;
    ratingCount: number | null;
    chaptersCount: number;
    createdAt: string;
    updatedAt: string | null;
};

export type CreateTitleRequest = {
    name: LocalizedString;
    type: string;
    cover?: string;
    synopsis?: LocalizedString;
    genres?: string[];
    status?: string;
    adult: boolean;
    /** Autores com papel. Opcional: se omitido, backend preserva o estado atual. */
    authors?: { authorId: number; role: string }[];
    /** IDs de editoras. Opcional: se omitido, backend preserva o estado atual. */
    publishers?: number[];
};

export type UpdateTitleRequest = Partial<CreateTitleRequest>;
