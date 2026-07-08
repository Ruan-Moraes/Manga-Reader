import type { AdminChapter, ChapterStatus, ChapterValidationError, CreateChapterRequest, UpdateChapterRequest } from './chapterAdmin.types';
import { canTransition } from './chapterStatus';

/**
 * Validações do domínio de capítulos — funções puras, sem dependência de UI.
 *
 * São executadas pelo gateway fake (papel de "servidor") e reusadas pelos
 * hooks de formulário para feedback inline. Erros são codes; a tradução
 * acontece só na camada de apresentação.
 */

export const CHAPTER_TITLE_MAX = 120;
export const CHAPTER_DESCRIPTION_MAX = 500;

/** Número válido: decimal positivo ("12", "12.5"). */
const NUMBER_PATTERN = /^\d+(\.\d+)?$/;

/** Normaliza para comparação de unicidade: "012.50" ≡ "12.5". */
export const normalizeChapterNumber = (value: string): string => {
    const trimmed = value.trim();
    if (!NUMBER_PATTERN.test(trimmed)) return trimmed;
    return String(parseFloat(trimmed));
};

export const isValidChapterNumber = (value: string): boolean => NUMBER_PATTERN.test(value.trim()) && parseFloat(value) >= 0;

/** Próximo número inteiro livre após o maior existente (frações contam). */
export const nextFreeChapterNumber = (numbers: string[]): string => {
    const max = numbers.reduce((acc, n) => {
        const parsed = parseFloat(n);
        return Number.isFinite(parsed) && parsed > acc ? parsed : acc;
    }, 0);
    return String(Math.floor(max) + 1);
};

type ChapterInput = (CreateChapterRequest | (UpdateChapterRequest & { titleId: string })) & { title?: string; number?: string };

/**
 * Valida dados de criação/edição. `siblingNumbers` são os números dos demais
 * capítulos ativos da mesma obra (o próprio capítulo, em edição, fica de fora).
 */
export const validateChapterInput = (input: ChapterInput, siblingNumbers: string[]): ChapterValidationError[] => {
    const errors: ChapterValidationError[] = [];

    if (!input.titleId?.trim()) errors.push({ code: 'title_id_required' });

    if (input.title !== undefined) {
        if (!input.title.trim()) errors.push({ code: 'title_required' });
        else if (input.title.trim().length > CHAPTER_TITLE_MAX) errors.push({ code: 'title_too_long', max: CHAPTER_TITLE_MAX });
    }

    if (input.number !== undefined) {
        if (!isValidChapterNumber(input.number)) {
            errors.push({ code: 'number_invalid' });
        } else {
            const normalized = normalizeChapterNumber(input.number);
            const taken = siblingNumbers.some(n => normalizeChapterNumber(n) === normalized);
            if (taken) errors.push({ code: 'number_taken', number: input.number });
        }
    }

    if (input.status === 'scheduled') {
        errors.push(...validateSchedule(input.scheduledAt, new Date()));
    }

    return errors;
};

const validateSchedule = (scheduledAt: string | undefined, now: Date): ChapterValidationError[] => {
    if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt)) || new Date(scheduledAt) <= now) {
        return [{ code: 'schedule_requires_future_date' }];
    }
    return [];
};

/**
 * Valida uma mudança de status considerando a máquina de estados e os
 * pré-requisitos de publicação/agendamento.
 */
export const validateStatusChange = (
    chapter: Pick<AdminChapter, 'status' | 'title'>,
    next: ChapterStatus,
    ctx: { readyPagesCount: number; now: Date; scheduledAt?: string },
): ChapterValidationError | null => {
    if (!canTransition(chapter.status, next)) {
        return { code: 'invalid_transition', from: chapter.status, to: next };
    }

    if (next === 'published') {
        if (!chapter.title.trim()) return { code: 'title_required' };
        if (ctx.readyPagesCount < 1) return { code: 'publish_requires_pages' };
    }

    if (next === 'scheduled') {
        const errors = validateSchedule(ctx.scheduledAt, ctx.now);
        if (errors.length) return errors[0];
    }

    return null;
};

/** Reordenação atômica: o conjunto novo deve ser exatamente o atual, sem duplicatas. */
export const validateReorder = (currentIds: string[], orderedIds: string[]): ChapterValidationError | null => {
    if (currentIds.length !== orderedIds.length) return { code: 'reorder_incomplete_set' };

    const seen = new Set(orderedIds);
    if (seen.size !== orderedIds.length) return { code: 'reorder_incomplete_set' };

    const current = new Set(currentIds);
    for (const id of orderedIds) {
        if (!current.has(id)) return { code: 'reorder_incomplete_set' };
    }

    return null;
};
