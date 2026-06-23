export type AdminAuthor = {
    id: string;
    name: string;
    slug: string;
    bio: string | null;
    nationality: string | null;
    createdAt: string;
    updatedAt: string | null;
};

export type CreateAuthorRequest = {
    name: string;
    slug?: string;
    bio?: string;
    nationality?: string;
};

export type UpdateAuthorRequest = CreateAuthorRequest;
