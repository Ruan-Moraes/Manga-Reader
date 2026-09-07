import { type ContentLanguageChain, normalizeContentLanguages } from '@/entities/content-language-preference';
import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/model';

interface ContentLocalesEnvelope {
    contentLocales?: unknown;
}

export async function patchMyContentLanguages(contentLocales: ContentLanguageChain, signal?: AbortSignal): Promise<ContentLanguageChain> {
    const response = await api.patch<ApiResponse<ContentLocalesEnvelope>>('/users/me/content-locales', { contentLocales }, { signal });
    return normalizeContentLanguages(response.data.data.contentLocales);
}
