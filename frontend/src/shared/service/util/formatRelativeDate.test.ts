import { describe, it, expect, vi } from 'vitest';

import formatRelativeDate from './formatRelativeDate';

describe('formatRelativeDate', () => {
    it('deve retornar "agora mesmo" para menos de 1 hora atras', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        expect(formatRelativeDate('2025-06-15T11:45:00Z')).toBe('agora mesmo');
        vi.useRealTimers();
    });

    it('deve retornar "ha 1 hora" para exatamente 1 hora atras', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        expect(formatRelativeDate('2025-06-15T11:00:00Z')).toBe('há 1 hora');
        vi.useRealTimers();
    });

    it('deve retornar "ha X horas" para mais de 1 hora e menos de 24', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        expect(formatRelativeDate('2025-06-15T07:00:00Z')).toBe('há 5 horas');
        vi.useRealTimers();
    });

    it('deve retornar "ha 1 dia" para exatamente 24 horas atras', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        expect(formatRelativeDate('2025-06-14T12:00:00Z')).toBe('há 1 dia');
        vi.useRealTimers();
    });

    it('deve retornar "ha X dias" para mais de 24 horas', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        expect(formatRelativeDate('2025-06-12T12:00:00Z')).toBe('há 3 dias');
        vi.useRealTimers();
    });

    it('deve retornar "agora mesmo" para data no futuro', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        expect(formatRelativeDate('2025-06-16T12:00:00Z')).toBe('agora mesmo');
        vi.useRealTimers();
    });

    it('deve retornar NaN-based string para data invalida', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        const resultado = formatRelativeDate('invalid-date');
        expect(typeof resultado).toBe('string');
        vi.useRealTimers();
    });

    it('deve retornar "agora mesmo" para data exatamente agora', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        expect(formatRelativeDate('2025-06-15T12:00:00Z')).toBe('agora mesmo');
        vi.useRealTimers();
    });
});
