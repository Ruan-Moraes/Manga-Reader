export type AdminPublisher = {
    id: number;
    name: string;
    slug: string;
    country: string | null;
    website: string | null;
    logoUrl: string | null;
    description: string | null;
    aliases: PublisherAlias[];
    createdAt: string;
    updatedAt: string | null;
};

export type PublisherAlias = {
    name: string;
    type: 'ALTERNATE' | 'ABBREVIATION' | 'ORIGINAL';
};

export type CreatePublisherRequest = {
    name: string;
    slug?: string;
    country?: string;
    website?: string;
    logoUrl?: string;
    description?: string;
    aliases?: PublisherAlias[];
};

export type UpdatePublisherRequest = CreatePublisherRequest;
