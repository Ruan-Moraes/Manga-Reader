import type { RelatedTitle } from '@entities/manga/@x/publisher';
import type { PageResponse } from '@shared/service/http';

export type PublisherAliasType = 'ALTERNATE' | 'ABBREVIATION' | 'ORIGINAL';

export type PublisherAlias = {
    id: number;
    name: string;
    type: PublisherAliasType;
};

export type Publisher = {
    id: number;
    name: string;
    slug: string;
    country?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    description?: string | null;
    aliases: PublisherAlias[];
    createdAt: string;
    updatedAt?: string | null;
};

export type PublisherWorksPage = PageResponse<RelatedTitle>;
export type { RelatedTitle };
