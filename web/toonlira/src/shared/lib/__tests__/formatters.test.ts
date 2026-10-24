import { afterEach, describe, it, expect } from 'vitest';

import { formatDate, formatShortDate } from '../formatters';

describe('formatDate — robustez', () => {
    afterEach(() => {
        delete document.documentElement.dataset.mrDateFormat;
        delete document.documentElement.dataset.mrTimezone;
    });
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

    it('aplica formato e timezone persistidos', () => {
        document.documentElement.dataset.mrDateFormat = 'MON_D';
        document.documentElement.dataset.mrTimezone = 'UTC';

        const formatted = formatShortDate('2024-01-15T23:30:00-03:00');
        expect(formatted).toMatch(/Jan|jan/i);
        expect(formatted).toMatch(/16/);
    });

    it('usa fallback seguro para timezone persistido inválido', () => {
        document.documentElement.dataset.mrTimezone = 'Invalid/Timezone';

        expect(formatShortDate('2024-01-15T00:00:00Z')).toMatch(/2024/);
    });
});
