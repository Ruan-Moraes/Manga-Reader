// Components
export { default as ChapterListItem } from './ui/ChapterListItem';
export { default as ChapterList } from './ui/ChapterList';
export { default as ChapterFilter } from './ui/ChapterFilter';
export { default as ChapterCoverImage } from './ui/ChapterCoverImage';
export { default as ChapterPages } from './ui/ChapterPages';

// Hooks
export { default as useChapterReader } from './model/useChapterReader';
export { default as useChapters } from './model/useChapters';
export { default as useChapter } from './model/useChapter';

// Types
export type { Chapter } from './model/chapter.types';

// Domínio administrativo de capítulos (armazenamento provisório — ver docs/architecture.md)
export type {
    AdminChapter,
    BulkResult,
    ChapterListQuery,
    ChapterPage,
    ChapterPageFormat,
    ChapterPageProcessingStatus,
    ChapterStatus,
    ChapterValidationError,
    CreateChapterRequest,
    NewPageInput,
    UpdateChapterRequest,
} from './model/admin/chapterAdmin.types';
export { CHAPTER_STATUSES, CHAPTER_STATUS_TO_API } from './model/admin/chapterAdmin.types';
export type { ReaderChapter, ReaderPage, ReaderProgress } from './model/admin/chapterReader.types';
export type {
    ChapterMetrics,
    ChapterMetricsFilter,
    ChapterMetricsSummaryRow,
    MetricsComparison,
    MetricsDevice,
    MetricsGranularity,
    MetricsPlatform,
    SeriesPoint,
} from './model/admin/chapterMetrics.types';
export type { ChapterAdminGateway } from './model/admin/chapterAdminGateway.port';
export type { ChapterPublicGateway, ReaderProgressGateway } from './model/admin/chapterPublicGateway.port';
export type { ChapterAnalyticsGateway } from './model/admin/chapterAnalyticsGateway.port';
export { ChapterDomainError } from './model/admin/chapterErrors';
export { CHAPTER_STATUS_TRANSITIONS, canTransition, isChapterPubliclyVisible } from './model/admin/chapterStatus';
export {
    CHAPTER_DESCRIPTION_MAX,
    CHAPTER_TITLE_MAX,
    isValidChapterNumber,
    nextFreeChapterNumber,
    normalizeChapterNumber,
    validateChapterInput,
    validateReorder,
    validateStatusChange,
} from './model/admin/chapterValidation';

// Gateways (implementação provisória localStorage — ponto de troca: chapterGateways.ts).
// Somente os singletons são API pública: as factories/store são detalhe de
// implementação (testes as importam por caminho relativo, dentro do slice).
export { chapterAdminGateway, chapterAnalyticsGateway, chapterPublicGateway, readerProgressGateway } from './api/admin/chapterGateways';
export { CHAPTER_STORE_KEY, readLegacyChapterImport, type LegacyChapterReadResult } from './api/admin/legacyChapterMigration';
