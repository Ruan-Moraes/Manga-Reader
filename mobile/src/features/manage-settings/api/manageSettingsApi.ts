import type { UserSettings } from '@/src/entities/user-setting';
import { normalizeUserSettings } from '@/src/entities/user-setting';
import { api } from '@/src/shared/api';
import type { ApiResponse } from '@/src/shared/model';

export async function updateMySettings(settings: UserSettings, signal?: AbortSignal): Promise<UserSettings> {
    const response = await api.patch<ApiResponse<unknown>>('/users/me/settings', settings, { signal });

    return normalizeUserSettings(response.data.data, settings);
}
