import type { LocalizedString } from '@shared/type/i18n';

export type AdminTitle = {
    id: string;
    name: LocalizedString;
    type: string;
    cover: string | null;
    synopsis: LocalizedString;
    genres: string[];
    status: string | null;
    author: string | null;
    artist: string | null;
    publisher: string | null;
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
    author?: string;
    artist?: string;
    publisher?: string;
    adult: boolean;
};

export type UpdateTitleRequest = Partial<CreateTitleRequest>;
