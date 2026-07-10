import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type { ActivityEvent } from '../model/activity.types';

export type GetActivityFeedParams = {
    page?: number;
    size?: number;
};

export const getUserActivityFeed = async (
    userId: string,
    { page = 0, size = 20 }: GetActivityFeedParams = {},
): Promise<PageResponse<ActivityEvent>> => {
    const response = await api.get<ApiResponse<PageResponse<ActivityEvent>>>(
        `${API_URLS.USERS}/${userId}/activity-feed`,
        { params: { page, size } },
    );

    return response.data.data;
};

export const hideActivityEvent = async (eventId: string): Promise<void> => {
    await api.delete(`${API_URLS.USERS}/me/activity-feed/${eventId}`);
};
