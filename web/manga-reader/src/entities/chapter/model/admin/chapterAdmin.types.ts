/**
 * Contratos do domínio administrativo de capítulos.
 *
 * O domínio front usa status em minúsculas (padrão das unions do frontend);
 * o contrato futuro da API usa enums MAIÚSCULOS (padrão do backend) — a
 * conversão acontece na borda via {@link CHAPTER_STATUS_TO_API}.
 */

export type ChapterStatus = 'draft' | 'processing' | 'scheduled' | 'published' | 'hidden' | 'unavailable' | 'archived';

export const CHAPTER_STATUSES: ChapterStatus[] = ['draft', 'processing', 'scheduled', 'published', 'hidden', 'unavailable', 'archived'];

/** Mapa para o contrato futuro da API (enums MAIÚSCULOS, padrão do backend). */
export const CHAPTER_STATUS_TO_API: Record<ChapterStatus, string> = {
    draft: 'DRAFT',
    processing: 'PROCESSING',
    scheduled: 'SCHEDULED',
    published: 'PUBLISHED',
    hidden: 'HIDDEN',
    unavailable: 'UNAVAILABLE',
    archived: 'ARCHIVED',
};

export type ChapterPageProcessingStatus = 'uploading' | 'processing' | 'ready' | 'error';

export type ChapterPageFormat = 'jpg' | 'png' | 'webp';

/** Capítulo na visão administrativa (inclui rascunhos, ocultos e soft-deletados). */
export type AdminChapter = {
    id: string;
    titleId: string;
    /** Nome da obra, desnormalizado para exibição em listagens. */
    titleName: string;
    title: string;
    /** Número em string — aceita frações tipo "12.5". Comparações via parseFloat. */
    number: string;
    displayOrder: number;
    /** Descrição/observação interna (não aparece no site público). */
    description: string | null;
    status: ChapterStatus;
    pagesCount: number;
    /** Páginas com processamento concluído — pré-requisito de publicação. */
    readyPagesCount: number;
    publishedAt: string | null;
    scheduledAt: string | null;
    /** Desnormalizados para listagem/ordenação por popularidade. */
    reads: number;
    completionRate: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string | null;
    /** Exclusão lógica — capítulos deletados não aparecem em listagens default. */
    deletedAt: string | null;
};

/** Página de um capítulo (metadados completos do arquivo). */
export type ChapterPage = {
    id: string;
    chapterId: string;
    order: number;
    originalFilename: string;
    imageUrl: string;
    thumbnailUrl: string;
    width: number;
    height: number;
    /** Em bytes. */
    fileSize: number;
    format: ChapterPageFormat;
    processingStatus: ChapterPageProcessingStatus;
    createdAt: string;
    updatedAt: string;
};

export type CreateChapterRequest = {
    titleId: string;
    title: string;
    number: string;
    displayOrder?: number;
    description?: string;
    status?: Extract<ChapterStatus, 'draft' | 'scheduled' | 'published'>;
    scheduledAt?: string;
};

export type UpdateChapterRequest = Partial<Omit<CreateChapterRequest, 'titleId'>>;

/** Entrada de página nova. Futuro (DT-44): carregará o `File` real + upload. */
export type NewPageInput = {
    originalFilename: string;
};

export type BulkResult = {
    succeeded: string[];
    failed: { id: string; error: ChapterValidationError }[];
};

/**
 * Consulta de listagem "server-side ready": paginação, busca, filtros e
 * ordenação são SEMPRE resolvidos pelo gateway (nunca no componente).
 */
export type ChapterListQuery = {
    page: number;
    size: number;
    sort?: 'number' | 'publishedAt' | 'updatedAt' | 'reads';
    direction?: 'asc' | 'desc';
    /** Busca por título OU número do capítulo. */
    search?: string;
    titleId?: string;
    status?: ChapterStatus[];
    publishedFrom?: string;
    publishedTo?: string;
    /** Inclui soft-deletados (default false). */
    includeDeleted?: boolean;
};

/** Erros de validação como codes — a UI traduz via i18n; o domínio nunca conhece strings de tela. */
export type ChapterValidationError =
    | { code: 'title_required' }
    | { code: 'title_too_long'; max: number }
    | { code: 'number_invalid' }
    | { code: 'number_taken'; number: string }
    | { code: 'publish_requires_pages' }
    | { code: 'schedule_requires_future_date' }
    | { code: 'invalid_transition'; from: ChapterStatus; to: ChapterStatus }
    | { code: 'reorder_incomplete_set' }
    | { code: 'chapter_not_found' }
    | { code: 'title_id_required' };
