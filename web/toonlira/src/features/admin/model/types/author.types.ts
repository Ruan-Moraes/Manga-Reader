export type AdminAuthor = {
    id: number;
    name: string;
    slug: string;
    bio: string | null;
    nationality: string | null;
    imageUrl: string | null;
    aliases: AuthorAlias[];
    createdAt: string;
    updatedAt: string | null;
};

export type AuthorAlias = {
    name: string;
    type: 'ALTERNATE' | 'PEN_NAME';
};

export type CreateAuthorRequest = {
    name: string;
    slug?: string;
    bio?: string;
    nationality?: string;
    imageUrl?: string;
    aliases?: AuthorAlias[];
};

export type UpdateAuthorRequest = CreateAuthorRequest;
