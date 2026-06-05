import { describe, it, expect } from 'vitest';

import { formatDate, formatShortDate } from '../formatters';

describe('formatDate — robustez', () => {
    it('formata uma data válida', () => {
        expect(formatDate('2024-01-15T00:00:00Z')).toMatch(/2024/);
    });

    it('retorna string vazia para data inválida (não lança RangeError)', () => {
        expect(formatDate('not-a-date')).toBe('');
        expect(formatDate('')).toBe('');
    });

    it('retorna string vazia para null/undefined', () => {
        expect(formatDate(null)).toBe('');
        expect(formatDate(undefined)).toBe('');
    });

    it('helpers derivados também não lançam para entrada inválida', () => {
        expect(formatShortDate(undefined as unknown as string)).toBe('');
    });
});
