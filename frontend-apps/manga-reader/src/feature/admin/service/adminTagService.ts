import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type {
    AdminTag,
    CreateTagRequest,
    UpdateTagRequest,
} from '../type/admin.types';

export const getAdminTags = async (
    page = 0,
    size = 20,
    search?: string,
): Promise<PageResponse<AdminTag>> => {
    const url = search ? `${API_URLS.TAGS}/search` : API_URLS.TAGS;
    const params = search ? { q: search, page, size } : { page, size };

    const response = await api.get<ApiResponse<PageResponse<AdminTag>>>(url, {
        params,
    });
    return response.data.data;
};

export const createTag = async (data: CreateTagRequest): Promise<AdminTag> => {
    const response = await api.post<ApiResponse<AdminTag>>(API_URLS.TAGS, data);
    return response.data.data;
};

export const updateTag = async (
    id: number,
    data: UpdateTagRequest,
): Promise<AdminTag> => {
    const response = await api.put<ApiResponse<AdminTag>>(
        `${API_URLS.TAGS}/${id}`,
        data,
    );
    return response.data.data;
};

export const deleteTag = async (id: number): Promise<void> => {
    await api.delete(`${API_URLS.TAGS}/${id}`);
};
