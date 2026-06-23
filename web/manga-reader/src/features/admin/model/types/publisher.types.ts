export type AdminPublisher = {
    id: string;
    name: string;
    slug: string;
    country: string | null;
    website: string | null;
    createdAt: string;
    updatedAt: string | null;
};

export type CreatePublisherRequest = {
    name: string;
    slug?: string;
    country?: string;
    website?: string;
};

export type UpdatePublisherRequest = CreatePublisherRequest;
