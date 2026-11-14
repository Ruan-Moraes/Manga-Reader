import { isAxiosError } from 'axios';

import { api, type ApiResponse } from '@shared/service/http';
import type { ChapterPublicGateway } from '../../model/admin/chapterPublicGateway.port';
import type { ReaderChapter } from '../../model/admin/chapterReader.types';
import type { ChapterStatus } from '../../model/admin/chapterAdmin.types';

type ApiReaderChapter = Omit<ReaderChapter, 'status'> & { status: string };

export const createHttpChapterPublicGateway = (): ChapterPublicGateway => ({
    async getReaderChapter(titleId, number, opts) {
        try {
            const response = await api.get<ApiResponse<ApiReaderChapter>>(`/api/titles/${titleId}/chapters/${number}/reader`, { params: { preview: opts?.includeUnpublished ?? false } });
            return { ...response.data.data, status: response.data.data.status.toLowerCase() as ChapterStatus };
        } catch (error) {
            // O interceptor HTTP normaliza erros Axios para ApiErrorResponse;
            // clientes isolados/testes ainda podem propagar o AxiosError cru.
            // Aceitar ambos preserva a semântica pública do 404 sem expor
            // placeholders sintéticos para capítulo ausente/não autorizado.
            const normalizedStatus = typeof error === 'object' && error !== null && 'statusCode' in error
                ? Number((error as { statusCode?: unknown }).statusCode)
                : undefined;
            if ((isAxiosError(error) && error.response?.status === 404) || normalizedStatus === 404) return 'blocked';
            throw error;
        }
    },
});
