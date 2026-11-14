import { API_URLS } from '@shared/constant/API_URLS';
import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';

import type {
    GlobalSearchEntityType,
    GlobalSearchResult,
    GlobalSearchSuggestions,
} from '../model/globalSearch.types';

export const getGlobalSearchSuggestions = async (
    query: string,
    limitPerType: number,
    signal?: AbortSignal,
): Promise<GlobalSearchSuggestions> => {
    const response = await api.get<ApiResponse<GlobalSearchSuggestions>>(API_URLS.GLOBAL_SEARCH_SUGGESTIONS, {
        params: { q: query, limitPerType },
        signal,
    });
    return response.data.data;
};

export const searchCatalog = async (
    query: string,
    type: GlobalSearchEntityType,
    page: number,
    size: number,
    signal?: AbortSignal,
): Promise<PageResponse<GlobalSearchResult>> => {
    const response = await api.get<ApiResponse<PageResponse<GlobalSearchResult>>>(API_URLS.GLOBAL_SEARCH, {
        params: { q: query, type, page, size },
        signal,
    });
    return response.data.data;
};
