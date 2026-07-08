import { describe, it, expect } from 'vitest';

import {
    CHAPTER_TITLE_MAX,
    isValidChapterNumber,
    nextFreeChapterNumber,
    normalizeChapterNumber,
    validateChapterInput,
    validateReorder,
    validateStatusChange,
} from '../chapterValidation';

const codes = (errors: { code: string }[]) => errors.map(e => e.code);

describe('chapterValidation', () => {
    describe('validateChapterInput', () => {
        const base = { titleId: 't1', title: 'Capítulo válido', number: '10' };

        it('aceita entrada válida', () => {
            expect(validateChapterInput(base, ['1', '2'])).toEqual([]);
        });

        it('exige obra associada', () => {
            expect(codes(validateChapterInput({ ...base, titleId: ' ' }, []))).toContain('title_id_required');
        });

        it('exige título não vazio', () => {
            expect(codes(validateChapterInput({ ...base, title: '   ' }, []))).toContain('title_required');
        });

        it('rejeita título acima do limite', () => {
            const errors = validateChapterInput({ ...base, title: 'x'.repeat(CHAPTER_TITLE_MAX + 1) }, []);
            expect(errors).toContainEqual({ code: 'title_too_long', max: CHAPTER_TITLE_MAX });
        });

        it('rejeita numeração inválida', () => {
            for (const bad of ['abc', '-1', '1.2.3', '']) {
                expect(codes(validateChapterInput({ ...base, number: bad }, [])), bad).toContain('number_invalid');
            }
        });

        it('aceita numeração fracionada', () => {
            expect(validateChapterInput({ ...base, number: '12.5' }, ['12'])).toEqual([]);
        });

        it('rejeita numeração duplicada na mesma obra', () => {
            expect(codes(validateChapterInput({ ...base, number: '2' }, ['1', '2']))).toContain('number_taken');
        });

        it('detecta duplicata com formatação diferente ("012.50" ≡ "12.5")', () => {
            expect(codes(validateChapterInput({ ...base, number: '012.50' }, ['12.5']))).toContain('number_taken');
        });

        it('agendamento exige data futura', () => {
            const past = new Date(Date.now() - 60_000).toISOString();
            expect(codes(validateChapterInput({ ...base, status: 'scheduled', scheduledAt: past }, []))).toContain('schedule_requires_future_date');
        });

        it('agendamento com data futura passa', () => {
            const future = new Date(Date.now() + 60_000).toISOString();
            expect(validateChapterInput({ ...base, status: 'scheduled', scheduledAt: future }, [])).toEqual([]);
        });
    });

    describe('validateStatusChange', () => {
        const draft = { status: 'draft' as const, title: 'Cap' };

        it('bloqueia publicação sem páginas prontas', () => {
            expect(validateStatusChange(draft, 'published', { readyPagesCount: 0, now: new Date() })).toEqual({ code: 'publish_requires_pages' });
        });

        it('publica com páginas prontas', () => {
            expect(validateStatusChange(draft, 'published', { readyPagesCount: 3, now: new Date() })).toBeNull();
        });

        it('bloqueia transição inválida (published → draft)', () => {
            expect(validateStatusChange({ status: 'published', title: 'Cap' }, 'draft', { readyPagesCount: 3, now: new Date() })).toEqual({
                code: 'invalid_transition',
                from: 'published',
                to: 'draft',
            });
        });

        it('agendamento sem data futura falha', () => {
            expect(validateStatusChange(draft, 'scheduled', { readyPagesCount: 3, now: new Date() })).toEqual({ code: 'schedule_requires_future_date' });
        });
    });

    describe('validateReorder', () => {
        it('aceita permutação completa', () => {
            expect(validateReorder(['a', 'b', 'c'], ['c', 'a', 'b'])).toBeNull();
        });

        it('rejeita subconjunto', () => {
            expect(validateReorder(['a', 'b', 'c'], ['a', 'b'])).toEqual({ code: 'reorder_incomplete_set' });
        });

        it('rejeita ids duplicados', () => {
            expect(validateReorder(['a', 'b', 'c'], ['a', 'b', 'b'])).toEqual({ code: 'reorder_incomplete_set' });
        });

        it('rejeita id estranho ao conjunto', () => {
            expect(validateReorder(['a', 'b', 'c'], ['a', 'b', 'z'])).toEqual({ code: 'reorder_incomplete_set' });
        });
    });

    describe('helpers de número', () => {
        it('isValidChapterNumber', () => {
            expect(isValidChapterNumber('0')).toBe(true);
            expect(isValidChapterNumber('12.5')).toBe(true);
            expect(isValidChapterNumber(' 7 ')).toBe(true);
            expect(isValidChapterNumber('12,5')).toBe(false);
        });

        it('normalizeChapterNumber', () => {
            expect(normalizeChapterNumber('012.50')).toBe('12.5');
            expect(normalizeChapterNumber('12.0')).toBe('12');
        });

        it('nextFreeChapterNumber ignora frações e avança do maior', () => {
            expect(nextFreeChapterNumber(['1', '2', '12.5'])).toBe('13');
            expect(nextFreeChapterNumber([])).toBe('1');
        });
    });
});
