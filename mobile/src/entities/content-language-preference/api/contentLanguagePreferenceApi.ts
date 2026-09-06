import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/model';

import { type ContentLanguageChain, normalizeContentLanguages } from '../model/contentLanguagePreference';

interface ContentLocalesEnvelope {
    contentLocales?: unknown;
}

export async function getMyContentLanguages(signal?: AbortSignal): Promise<ContentLanguageChain> {
    const response = await api.get<ApiResponse<ContentLocalesEnvelope>>('/users/me/content-locales', { signal });
    return normalizeContentLanguages(response.data.data.contentLocales);
}
