import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type { AdminAuthor, CreateAuthorRequest, UpdateAuthorRequest } from '../model/admin.types';

export const getAdminAuthors = async (page = 0, size = 20, search?: string): Promise<PageResponse<AdminAuthor>> => {
    const response = await api.get<ApiResponse<PageResponse<AdminAuthor>>>(API_URLS.AUTHORS, {
        params: { ...(search ? { name: search } : {}), page, size },
    });
    return response.data.data;
};

export const createAuthor = async (data: CreateAuthorRequest): Promise<AdminAuthor> => {
    const response = await api.post<ApiResponse<AdminAuthor>>(API_URLS.ADMIN_AUTHORS, data);
    return response.data.data;
};

export const updateAuthor = async (id: string, data: UpdateAuthorRequest): Promise<AdminAuthor> => {
    const response = await api.put<ApiResponse<AdminAuthor>>(`${API_URLS.ADMIN_AUTHORS}/${id}`, data);
    return response.data.data;
};

export const deleteAuthor = async (id: string): Promise<void> => {
    await api.delete(`${API_URLS.ADMIN_AUTHORS}/${id}`);
};
