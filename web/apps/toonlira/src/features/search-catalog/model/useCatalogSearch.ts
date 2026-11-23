import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getGlobalSearchSuggestions, searchCatalog } from '../api/globalSearchService';
import type { GlobalSearchEntityType } from './globalSearch.types';
import { normalizeSearchTerm } from './recentSearchStorage';

const valid = (query: string) => query.length >= 2 && query.length <= 100;

export const useGlobalSearchSuggestions = (query: string, limitPerType: number) => {
    const normalized = normalizeSearchTerm(query);
    return useQuery({
        queryKey: [QUERY_KEYS.GLOBAL_SEARCH_SUGGESTIONS, normalized, limitPerType],
        queryFn: ({ signal }) => getGlobalSearchSuggestions(normalized, limitPerType, signal),
        enabled: valid(normalized),
        staleTime: 5 * 60 * 1000,
    });
};

export const useCatalogSearch = (
    query: string,
    type: GlobalSearchEntityType | undefined,
    page: number,
    size: number,
) => {
    const normalized = normalizeSearchTerm(query);
    return useQuery({
        queryKey: [QUERY_KEYS.GLOBAL_SEARCH, normalized, type, page, size],
        queryFn: ({ signal }) => searchCatalog(normalized, type!, page, size, signal),
        enabled: valid(normalized) && type != null,
        placeholderData: keepPreviousData,
    });
};
