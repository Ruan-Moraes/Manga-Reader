import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type {
    AdminEvent,
    CreateEventRequest,
    UpdateEventRequest,
} from '../type/admin.types';

export const getAdminEvents = async (
    page = 0,
    size = 20,
    search?: string,
    sort = 'startDate',
    direction = 'desc',
): Promise<PageResponse<AdminEvent>> => {
    const response = await api.get<ApiResponse<PageResponse<AdminEvent>>>(
        API_URLS.ADMIN_EVENTS,
        { params: { page, size, search, sort, direction } },
    );
    return response.data.data;
};

export const getAdminEventDetail = async (
    eventId: string,
): Promise<AdminEvent> => {
    const response = await api.get<ApiResponse<AdminEvent>>(
        `${API_URLS.ADMIN_EVENTS}/${eventId}`,
    );
    return response.data.data;
};

export const createEvent = async (
    data: CreateEventRequest,
): Promise<AdminEvent> => {
    const response = await api.post<ApiResponse<AdminEvent>>(
        API_URLS.ADMIN_EVENTS,
        data,
    );
    return response.data.data;
};

export const updateEvent = async (
    eventId: string,
    data: UpdateEventRequest,
): Promise<AdminEvent> => {
    const response = await api.patch<ApiResponse<AdminEvent>>(
        `${API_URLS.ADMIN_EVENTS}/${eventId}`,
        data,
    );
    return response.data.data;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
    await api.delete(`${API_URLS.ADMIN_EVENTS}/${eventId}`);
};
