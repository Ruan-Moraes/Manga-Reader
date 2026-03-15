import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type Title } from '../type/title.types';

export const getTitles = async (
    page = 0,
    size = 20,
): Promise<PageResponse<Title>> => {
    const response = await api.get<ApiResponse<PageResponse<Title>>>(
        API_URLS.TITLES,
        { params: { page, size } },
    );

    return response.data.data;
};

export const getTitleById = async (id: string): Promise<Title> => {
    const response = await api.get<ApiResponse<Title>>(
        `${API_URLS.TITLES}/${id}`,
    );

    return response.data.data;
};

export const searchTitles = async (
    query: string,
    page = 0,
    size = 20,
): Promise<PageResponse<Title>> => {
    const response = await api.get<ApiResponse<PageResponse<Title>>>(
        API_URLS.TITLES_SEARCH,
        { params: { q: query, page, size } },
    );

    return response.data.data;
};

export const getTitlesByGenre = async (
    genre: string,
    page = 0,
    size = 20,
): Promise<PageResponse<Title>> => {
    const response = await api.get<ApiResponse<PageResponse<Title>>>(
        `${API_URLS.TITLES_BY_GENRE}/${genre}`,
        { params: { page, size } },
    );

    return response.data.data;
};

export const filterTitles = async (
    params: Record<string, string | number>,
    page = 0,
    size = 20,
): Promise<PageResponse<Title>> => {
    const response = await api.get<ApiResponse<PageResponse<Title>>>(
        API_URLS.TITLES_FILTER,
        { params: { ...params, page, size } },
    );

    return response.data.data;
};
