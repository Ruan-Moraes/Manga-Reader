import type { UserSettings } from '@/entities/user-setting';
import { normalizeUserSettings } from '@/entities/user-setting';
import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/model';

export async function updateMySettings(settings: UserSettings, signal?: AbortSignal): Promise<UserSettings> {
    const response = await api.patch<ApiResponse<unknown>>('/users/me/settings', settings, { signal });

    return normalizeUserSettings(response.data.data, settings);
}
