import type { AuthorRole, RelatedTitle } from '@entities/manga/@x/author';
import type { PageResponse } from '@shared/service/http';

export type AuthorAliasType = 'ALTERNATE' | 'PEN_NAME';

export type AuthorAlias = {
    id: number;
    name: string;
    type: AuthorAliasType;
};

export type Author = {
    id: number;
    name: string;
    slug: string;
    bio?: string | null;
    nationality?: string | null;
    imageUrl?: string | null;
    aliases: AuthorAlias[];
    roles: AuthorRole[];
    createdAt: string;
    updatedAt?: string | null;
};

export type AuthorWorksPage = PageResponse<RelatedTitle>;
export type { AuthorRole, RelatedTitle };
