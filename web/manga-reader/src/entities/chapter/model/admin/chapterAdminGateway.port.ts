import type { PageResponse } from '@shared/service/http';

import type {
    AdminChapter,
    BulkResult,
    ChapterListQuery,
    ChapterPage,
    ChapterStatus,
    CreateChapterRequest,
    NewPageInput,
    UpdateChapterRequest,
    LegacyChapterImportPayload,
    LegacyChapterImportResult,
} from './chapterAdmin.types';

/**
 * Port administrativo de capítulos.
 *
 * Implementação atual: repositório fake em localStorage (armazenamento
 * definitivo adiado — DT-44). A troca pela API real acontece reimplementando
 * este contrato com axios sobre `/api/admin/...` e trocando a instância em
 * `api/admin/chapterGateways.ts` — componentes, hooks e validações não mudam.
 *
 * Paginação, busca, filtros e ordenação são responsabilidade do gateway
 * ("server-side ready"): a UI nunca carrega/filtra o conjunto completo.
 */
export interface ChapterAdminGateway {
    list(query: ChapterListQuery): Promise<PageResponse<AdminChapter>>;
    getById(chapterId: string): Promise<AdminChapter>;
    create(data: CreateChapterRequest): Promise<AdminChapter>;
    update(chapterId: string, data: UpdateChapterRequest): Promise<AdminChapter>;
    /** Duplica como rascunho: próximo número livre, fim da ordem, datas zeradas, páginas clonadas. */
    duplicate(chapterId: string): Promise<AdminChapter>;
    /** Exclusão lógica — marca `deletedAt`; some das listagens default. */
    softDelete(chapterId: string): Promise<void>;
    changeStatus(chapterId: string, status: ChapterStatus, opts?: { scheduledAt?: string }): Promise<AdminChapter>;
    /** Atômico: `orderedIds` deve conter exatamente os capítulos ativos da obra, senão rejeita tudo. */
    reorderChapters(titleId: string, orderedIds: string[]): Promise<void>;
    /** Valida item a item; itens inválidos não abortam o lote (resultado parcial). */
    bulkChangeStatus(ids: string[], status: ChapterStatus): Promise<BulkResult>;
    bulkDelete(ids: string[]): Promise<BulkResult>;
    importLegacy(payload: LegacyChapterImportPayload): Promise<LegacyChapterImportResult>;

    listPages(chapterId: string): Promise<ChapterPage[]>;
    /** Inicia o pipeline simulado uploading→processing→ready|error de cada página. */
    addPages(chapterId: string, files: NewPageInput[]): Promise<ChapterPage[]>;
    removePage(chapterId: string, pageId: string): Promise<void>;
    removePages(chapterId: string, pageIds: string[]): Promise<BulkResult>;
    replacePage(chapterId: string, pageId: string, file: NewPageInput): Promise<ChapterPage>;
    /** Atômico: mesmo contrato de `reorderChapters`, para as páginas do capítulo. */
    reorderPages(chapterId: string, orderedIds: string[]): Promise<ChapterPage[]>;
    /** Posição manual 1-based; demais páginas deslocam de forma previsível. */
    movePage(chapterId: string, pageId: string, toPosition: number): Promise<ChapterPage[]>;
    retryPageProcessing(chapterId: string, pageId: string): Promise<ChapterPage>;
}
