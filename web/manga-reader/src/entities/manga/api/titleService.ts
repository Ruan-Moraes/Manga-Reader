import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type Title, type TitleSearchResult } from '../model/title.types';

export const getTitles = async (page = 0, size = 20): Promise<PageResponse<Title>> => {
    const response = await api.get<ApiResponse<PageResponse<Title>>>(API_URLS.TITLES, { params: { page, size } });

    return response.data.data;
};

export const getRecentTitles = async (size = 8): Promise<PageResponse<Title>> => {
    const response = await api.get<ApiResponse<PageResponse<Title>>>(API_URLS.TITLES, {
        params: { page: 0, size, sort: 'createdAt', direction: 'desc' },
    });
    return response.data.data;
};

export const getTitleById = async (id: string): Promise<Title> => {
    const response = await api.get<ApiResponse<Title>>(`${API_URLS.TITLES}/${id}`);

    return response.data.data;
};

export const searchTitles = async (query: string, page = 0, size = 20, signal?: AbortSignal): Promise<PageResponse<TitleSearchResult>> => {
    const response = await api.get<ApiResponse<PageResponse<TitleSearchResult>>>(API_URLS.TITLES_SEARCH, {
        params: { q: query, page, size },
        signal,
    });

    return response.data.data;
};

export const getTitlesByGenre = async (genre: string, page = 0, size = 20): Promise<PageResponse<Title>> => {
    const response = await api.get<ApiResponse<PageResponse<Title>>>(`${API_URLS.TITLES_BY_GENRE}/${genre}`, { params: { page, size } });

    return response.data.data;
};

export const filterTitles = async (params: Record<string, string | string[] | number | boolean>, page = 0, size = 20): Promise<PageResponse<Title>> => {
    const response = await api.get<ApiResponse<PageResponse<Title>>>(API_URLS.TITLES_FILTER, { params: { ...params, page, size } });

    return response.data.data;
};
