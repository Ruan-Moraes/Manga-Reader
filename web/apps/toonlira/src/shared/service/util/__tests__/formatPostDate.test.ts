import { describe, it, expect, vi } from 'vitest';

import { formatPostDate } from '../formatPostDate';

describe('formatPostDate', () => {
    it('retorna label relativo + title absoluto para ISO válido', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        const { label, title } = formatPostDate('2025-06-12T12:00:00Z');

        expect(label).toBe('há 3 dias');
        expect(title).toMatch(/2025/);
        expect(title).not.toContain('NaN');
        vi.useRealTimers();
    });

    // Regressão: api manda ISO_LOCAL_DATE_TIME com até 9 dígitos de fração (nanos).
    // `new Date()` puro retornaria Invalid Date → title vazio. Deve normalizar.
    it('normaliza nanossegundos no title absoluto', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        const { label, title } = formatPostDate('2025-06-15T11:00:00.123456789');

        expect(label).not.toContain('NaN');
        expect(title).not.toBe('');
        expect(title).not.toContain('NaN');
        vi.useRealTimers();
    });

    it('retorna ambos vazios para entrada ausente ou inválida', () => {
        expect(formatPostDate(undefined)).toEqual({ label: '', title: '' });
        expect(formatPostDate('')).toEqual({ label: '', title: '' });
        expect(formatPostDate('not-a-date')).toEqual({ label: '', title: '' });
    });
});
