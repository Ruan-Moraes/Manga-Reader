import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/model';

import { normalizeUserSettings, type UserSettings } from '../model/userSettings';

export async function getMySettings(signal?: AbortSignal): Promise<UserSettings> {
    const response = await api.get<ApiResponse<unknown>>('/users/me/settings', { signal });

    return normalizeUserSettings(response.data.data);
}
