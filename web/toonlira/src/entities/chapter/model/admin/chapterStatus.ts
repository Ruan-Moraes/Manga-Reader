import type { ChapterStatus } from './chapterAdmin.types';

/**
 * Máquina de estados do capítulo.
 *
 * - `draft`       → edição livre; ponto de partida e de retorno.
 * - `processing`  → páginas em processamento (pipeline de imagens).
 * - `scheduled`   → publicação agendada (exige data futura).
 * - `published`   → único status visível publicamente.
 * - `hidden`      → retirado do site, acessível só no painel admin.
 * - `unavailable` → indisponível (ex.: problema de licenciamento).
 * - `archived`    → arquivado; nunca aparece publicamente.
 */
export const CHAPTER_STATUS_TRANSITIONS: Record<ChapterStatus, ChapterStatus[]> = {
    draft: ['processing', 'scheduled', 'published', 'archived'],
    processing: ['draft', 'published'],
    scheduled: ['draft', 'published', 'archived'],
    published: ['hidden', 'unavailable', 'archived'],
    hidden: ['published', 'archived'],
    unavailable: ['published', 'archived'],
    archived: ['draft'],
};

export const canTransition = (from: ChapterStatus, to: ChapterStatus): boolean => CHAPTER_STATUS_TRANSITIONS[from].includes(to);

/** Apenas `published` aparece no site; todo o resto é restrito ao painel. */
export const isChapterPubliclyVisible = (status: ChapterStatus): boolean => status === 'published';
