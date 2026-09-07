import { normalizePrivacySettings, type PrivacyPatch, type PrivacySettings } from '@/entities/user';
import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/model';

export async function patchMyPrivacy(patch: PrivacyPatch, signal?: AbortSignal): Promise<PrivacySettings> {
    const response = await api.patch<ApiResponse<unknown>>('/users/me/privacy', patch, { signal });
    return normalizePrivacySettings(response.data.data);
}

export async function getMyPrivacy(signal?: AbortSignal): Promise<PrivacySettings> {
    const response = await api.get<ApiResponse<{ privacySettings?: unknown }>>('/users/me/profile', { signal });
    return normalizePrivacySettings(response.data.data.privacySettings);
}
