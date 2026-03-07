import { api } from '@shared/service/http';
import type { ApiResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type User } from '../type/user.types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getUserProfile = async (userId: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(
        `${API_URLS.USERS}/${userId}`,
    );

    return response.data.data;
};

export const updateProfile = async (
    partial: Partial<User>,
): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(
        `${API_URLS.USERS}/me`,
        partial,
    );

    return response.data.data;
};
