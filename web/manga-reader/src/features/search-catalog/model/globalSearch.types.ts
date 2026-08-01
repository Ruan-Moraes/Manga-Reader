import type { Title } from '@entities/manga';

export type GlobalSearchEntityType = 'TITLE' | 'AUTHOR' | 'ARTIST' | 'PUBLISHER' | 'GROUP';

export type GlobalSearchMatchType =
    | 'PRIMARY_NAME'
    | 'TRANSLATED_TITLE'
    | 'ALTERNATE_NAME'
    | 'PEN_NAME'
    | 'ABBREVIATION'
    | 'ORIGINAL_NAME'
    | 'USERNAME'
    | 'RELATED_AUTHOR'
    | 'RELATED_ARTIST'
    | 'RELATED_PUBLISHER'
    | 'RELATED_GROUP';

export type GlobalSearchResult = {
    id: string;
    slug?: string | null;
    entityType: GlobalSearchEntityType;
    name: string;
    image?: string | null;
    matchedBy: GlobalSearchMatchType;
    matchedText?: string | null;
    roles: string[];
    workCount: number;
    titleType?: string | null;
    status?: string | null;
    adult?: boolean | null;
    primaryContributor?: string | null;
    country?: string | null;
};

export type GlobalSearchSection = {
    type: GlobalSearchEntityType;
    totalElements: number;
    items: GlobalSearchResult[];
};

export type GlobalSearchSuggestions = {
    sections: GlobalSearchSection[];
    totalElements: number;
};

export type GlobalSearchOption =
    | { kind: 'suggestion'; title: Title }
    | { kind: 'result'; result: GlobalSearchResult; sectionType: GlobalSearchEntityType }
    | { kind: 'recent'; term: string }
    | { kind: 'all'; term: string };
