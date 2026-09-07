import { api } from '@shared/service/http';
import type { ApiResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type { ReaderProgressGateway } from '../../model/admin/chapterPublicGateway.port';
import type { ReaderProgress } from '../../model/admin/chapterReader.types';

type ReadingProgressResponse = {
    titleId: string;
    chapterNumber: string;
    currentPage: number;
    totalPages: number;
    completed: boolean;
    updatedAt: string;
};

/**
 * Progresso de leitura via backend (`/api/users/me/reading-progress`).
 * Mapeia a nomenclatura do backend (chapterNumber/currentPage) para o
 * contrato mínimo já usado pelo leitor ({@link ReaderProgress}).
 */
export const createHttpReaderProgressGateway = (): ReaderProgressGateway => ({
    async saveProgress(titleId, chapterNumber, page, totalPages, completed) {
        await api.put(`${API_URLS.USERS}/me/reading-progress`, {
            titleId,
            chapterNumber,
            currentPage: page,
            totalPages,
            completed,
        });
    },

    async getProgress(titleId): Promise<ReaderProgress | null> {
        const response = await api.get<ApiResponse<ReadingProgressResponse | null>>(`${API_URLS.USERS}/me/reading-progress/${titleId}`);
        const data = response.data.data;

        return data ? { chapter: Number(data.chapterNumber) || 1, page: data.currentPage } : null;
    },
});
