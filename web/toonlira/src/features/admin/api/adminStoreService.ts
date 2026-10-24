import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';
import type { AdminStore, StoreRequest } from '../model/admin.types';

export const getAdminStores = async (page = 0, size = 20, search?: string, status?: string): Promise<PageResponse<AdminStore>> =>
    (await api.get<ApiResponse<PageResponse<AdminStore>>>(API_URLS.ADMIN_STORES, { params: { page, size, search, status } })).data.data;
export const createStore = async (data: StoreRequest): Promise<AdminStore> =>
    (await api.post<ApiResponse<AdminStore>>(API_URLS.ADMIN_STORES, data)).data.data;
export const updateStore = async (id: string, data: StoreRequest): Promise<AdminStore> =>
    (await api.put<ApiResponse<AdminStore>>(`${API_URLS.ADMIN_STORES}/${id}`, data)).data.data;
export const deleteStore = async (id: string): Promise<void> => { await api.delete(`${API_URLS.ADMIN_STORES}/${id}`); };
