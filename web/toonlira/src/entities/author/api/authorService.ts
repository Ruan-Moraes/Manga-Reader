import { API_URLS } from '@shared/constant/API_URLS';
import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';

import type { Author, RelatedTitle } from '../model/author.types';

export const getAuthorBySlug = async (slug: string, signal?: AbortSignal): Promise<Author> => {
    const response = await api.get<ApiResponse<Author>>(`${API_URLS.AUTHORS}/slug/${encodeURIComponent(slug)}`, { signal });
    return response.data.data;
};

export const getAuthorWorks = async (
    authorId: number,
    page: number,
    size: number,
    kind: 'AUTHOR' | 'ARTIST' | undefined,
    signal?: AbortSignal,
): Promise<PageResponse<RelatedTitle>> => {
    const response = await api.get<ApiResponse<PageResponse<RelatedTitle>>>(`${API_URLS.AUTHORS}/${authorId}/works`, {
        params: { page, size, kind },
        signal,
    });
    return response.data.data;
};
