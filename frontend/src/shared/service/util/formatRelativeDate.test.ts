import { describe, it, expect, vi, afterEach } from 'vitest';

import formatRelativeDate from './formatRelativeDate';

describe('formatRelativeDate', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('deve retornar "agora mesmo" para menos de 1 hora atras', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        const thirtyMinutesAgo = '2025-06-15T11:45:00Z';

        expect(formatRelativeDate(thirtyMinutesAgo)).toBe('agora mesmo');
    });

    it('deve retornar "ha 1 hora" para exatamente 1 hora atras', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        const oneHourAgo = '2025-06-15T11:00:00Z';

        expect(formatRelativeDate(oneHourAgo)).toBe('há 1 hora');
    });

    it('deve retornar "ha X horas" para mais de 1 hora e menos de 24', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        const fiveHoursAgo = '2025-06-15T07:00:00Z';

        expect(formatRelativeDate(fiveHoursAgo)).toBe('há 5 horas');
    });

    it('deve retornar "ha 1 dia" para exatamente 24 horas atras', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        const oneDayAgo = '2025-06-14T12:00:00Z';

        expect(formatRelativeDate(oneDayAgo)).toBe('há 1 dia');
    });

    it('deve retornar "ha X dias" para mais de 24 horas', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        const threeDaysAgo = '2025-06-12T12:00:00Z';

        expect(formatRelativeDate(threeDaysAgo)).toBe('há 3 dias');
    });
});
