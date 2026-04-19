import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type {
    AdminTitle,
    CreateTitleRequest,
    UpdateTitleRequest,
} from '../type/admin.types';

export const getAdminTitles = async (
    page = 0,
    size = 20,
    search?: string,
    sort = 'createdAt',
    direction = 'desc',
): Promise<PageResponse<AdminTitle>> => {
    const response = await api.get<ApiResponse<PageResponse<AdminTitle>>>(
        API_URLS.ADMIN_TITLES,
        { params: { page, size, search, sort, direction } },
    );
    return response.data.data;
};

export const getAdminTitleDetail = async (
    titleId: string,
): Promise<AdminTitle> => {
    const response = await api.get<ApiResponse<AdminTitle>>(
        `${API_URLS.ADMIN_TITLES}/${titleId}`,
    );
    return response.data.data;
};

export const createTitle = async (
    data: CreateTitleRequest,
): Promise<AdminTitle> => {
    const response = await api.post<ApiResponse<AdminTitle>>(
        API_URLS.ADMIN_TITLES,
        data,
    );
    return response.data.data;
};

export const updateTitle = async (
    titleId: string,
    data: UpdateTitleRequest,
): Promise<AdminTitle> => {
    const response = await api.patch<ApiResponse<AdminTitle>>(
        `${API_URLS.ADMIN_TITLES}/${titleId}`,
        data,
    );
    return response.data.data;
};

export const deleteTitle = async (titleId: string): Promise<void> => {
    await api.delete(`${API_URLS.ADMIN_TITLES}/${titleId}`);
};
