import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type { AdminPublisher, CreatePublisherRequest, UpdatePublisherRequest } from '../model/admin.types';

export const getAdminPublishers = async (page = 0, size = 20, search?: string): Promise<PageResponse<AdminPublisher>> => {
    const response = await api.get<ApiResponse<PageResponse<AdminPublisher>>>(API_URLS.PUBLISHERS, {
        params: { ...(search ? { name: search } : {}), page, size },
    });
    return response.data.data;
};

export const createPublisher = async (data: CreatePublisherRequest): Promise<AdminPublisher> => {
    const response = await api.post<ApiResponse<AdminPublisher>>(API_URLS.ADMIN_PUBLISHERS, data);
    return response.data.data;
};

export const updatePublisher = async (id: string, data: UpdatePublisherRequest): Promise<AdminPublisher> => {
    const response = await api.put<ApiResponse<AdminPublisher>>(`${API_URLS.ADMIN_PUBLISHERS}/${id}`, data);
    return response.data.data;
};

export const deletePublisher = async (id: string): Promise<void> => {
    await api.delete(`${API_URLS.ADMIN_PUBLISHERS}/${id}`);
};
