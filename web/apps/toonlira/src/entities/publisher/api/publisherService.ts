import { API_URLS } from '@shared/constant/API_URLS';
import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';

import type { Publisher, RelatedTitle } from '../model/publisher.types';

export const getPublisherBySlug = async (slug: string, signal?: AbortSignal): Promise<Publisher> => {
    const response = await api.get<ApiResponse<Publisher>>(`${API_URLS.PUBLISHERS}/slug/${encodeURIComponent(slug)}`, { signal });
    return response.data.data;
};

export const getPublisherWorks = async (
    publisherId: number,
    page: number,
    size: number,
    signal?: AbortSignal,
): Promise<PageResponse<RelatedTitle>> => {
    const response = await api.get<ApiResponse<PageResponse<RelatedTitle>>>(`${API_URLS.PUBLISHERS}/${publisherId}/works`, {
        params: { page, size },
        signal,
    });
    return response.data.data;
};
