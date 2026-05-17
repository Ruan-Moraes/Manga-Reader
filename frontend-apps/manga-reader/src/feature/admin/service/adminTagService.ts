import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type {
    AdminTag,
    CreateTagRequest,
    UpdateTagRequest,
} from '../type/admin.types';

type AdminTagApi = {
    value: number;
    label: Record<string, string>;
};

const fromAdminTagApi = (raw: AdminTagApi): AdminTag => {
    return { value: raw.value, label: raw.label };
};

export const getAdminTags = async (
    page = 0,
    size = 20,
    search?: string,
): Promise<PageResponse<AdminTag>> => {
    if (search) {
        const response = await api.get<ApiResponse<PageResponse<AdminTag>>>(
            `${API_URLS.TAGS}/search`,
            { params: { q: search, page, size } },
        );
        return response.data.data;
    }
    const response = await api.get<ApiResponse<PageResponse<AdminTagApi>>>(
        `${API_URLS.TAGS}/admin`,
        { params: { page, size } },
    );
    const data = response.data.data;
    return { ...data, content: data.content.map(fromAdminTagApi) };
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
