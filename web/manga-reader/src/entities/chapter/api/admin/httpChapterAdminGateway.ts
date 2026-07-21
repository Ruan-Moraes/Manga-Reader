import { api, type ApiResponse, type PageResponse } from '@shared/service/http';

import type { ChapterAdminGateway } from '../../model/admin/chapterAdminGateway.port';
import type { AdminChapter, BulkResult, ChapterStatus, LegacyChapterImportResult } from '../../model/admin/chapterAdmin.types';

type ApiChapter = Omit<AdminChapter, 'status'> & { status: string; version?: number; pages?: unknown[] };
const statusFromApi = (status: string) => status.toLowerCase() as ChapterStatus;
const mapChapter = (chapter: ApiChapter): AdminChapter => ({ ...chapter, status: statusFromApi(chapter.status) });
const unavailable = (): never => { throw new Error('Chapter page upload requires the media service and is unavailable'); };

export const createHttpChapterAdminGateway = (): ChapterAdminGateway => ({
    async list(query) {
        const response = await api.get<ApiResponse<PageResponse<ApiChapter>>>('/api/admin/chapters', {
            params: { ...query, status: query.status?.map(status => status.toUpperCase()) },
        });
        return { ...response.data.data, content: response.data.data.content.map(mapChapter) };
    },
    async getById(id) {
        const response = await api.get<ApiResponse<ApiChapter>>(`/api/admin/chapters/${id}`);
        return mapChapter(response.data.data);
    },
    async create(data) {
        const response = await api.post<ApiResponse<ApiChapter>>('/api/admin/chapters', { ...data, status: data.status?.toUpperCase() });
        return mapChapter(response.data.data);
    },
    async update(id, data) {
        const response = await api.patch<ApiResponse<ApiChapter>>(`/api/admin/chapters/${id}`, data);
        return mapChapter(response.data.data);
    },
    async duplicate(id) {
        const response = await api.post<ApiResponse<ApiChapter>>(`/api/admin/chapters/${id}/duplicate`);
        return mapChapter(response.data.data);
    },
    async softDelete(id) { await api.delete(`/api/admin/chapters/${id}`); },
    async changeStatus(id, status, opts) {
        const response = await api.post<ApiResponse<ApiChapter>>(`/api/admin/chapters/${id}/status`, { status: status.toUpperCase(), scheduledAt: opts?.scheduledAt });
        return mapChapter(response.data.data);
    },
    async reorderChapters(titleId, orderedIds) {
        await api.post('/api/admin/chapters/reorder', { titleId, orderedIds });
    },
    async bulkChangeStatus(ids, status) {
        const result: BulkResult = { succeeded: [], failed: [] };
        for (const id of ids) {
            try { await this.changeStatus(id, status); result.succeeded.push(id); }
            catch { result.failed.push({ id, error: { code: 'invalid_transition', from: status, to: status } }); }
        }
        return result;
    },
    async bulkDelete(ids) {
        const result: BulkResult = { succeeded: [], failed: [] };
        for (const id of ids) {
            try { await this.softDelete(id); result.succeeded.push(id); }
            catch { result.failed.push({ id, error: { code: 'chapter_not_found' } }); }
        }
        return result;
    },
    async importLegacy(payload) {
        const chapters = payload.chapters.map(chapter => ({ ...chapter, status: chapter.status.toUpperCase() }));
        const response = await api.post<ApiResponse<LegacyChapterImportResult>>('/api/admin/chapters/import-legacy', { chapters });
        return response.data.data;
    },
    async listPages(id) {
        const response = await api.get<ApiResponse<ApiChapter>>(`/api/admin/chapters/${id}`);
        return ((response.data.data.pages ?? []) as never[]);
    },
    async addPages() { return unavailable(); },
    async removePage() { unavailable(); },
    async removePages() { return unavailable(); },
    async replacePage() { return unavailable(); },
    async reorderPages() { return unavailable(); },
    async movePage() { return unavailable(); },
    async retryPageProcessing() { return unavailable(); },
});
