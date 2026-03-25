import { describe, it, expect } from 'vitest';

import formatDate from './formatDate';

describe('formatDate', () => {
    const fixedDate = new Date('2025-06-15T14:30:00Z');

    it('deve formatar data com ano, mes e dia numericos', () => {
        const resultado = formatDate(fixedDate, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        expect(resultado).toContain('2025');
        expect(resultado).toContain('06');
        expect(resultado).toContain('15');
    });

    it('deve formatar mes por extenso quando month e long', () => {
        const resultado = formatDate(fixedDate, { month: 'long' });

        expect(resultado.toLowerCase()).toContain('junho');
    });

    it('deve aceitar string ISO como entrada', () => {
        const resultado = formatDate('2025-06-15T14:30:00Z', {
            year: 'numeric',
        });

        expect(resultado).toContain('2025');
    });

    it('deve formatar hora e minuto quando informados', () => {
        const resultado = formatDate(fixedDate, {
            hour: '2-digit',
            minute: '2-digit',
        });

        // O horario depende do timezone do ambiente, mas deve conter digitos
        expect(resultado).toMatch(/\d{2}:\d{2}/);
    });

    it('deve retornar string vazia de opcoes nao informadas', () => {
        const resultado = formatDate(fixedDate, {});

        // Intl com opcoes vazias ainda retorna algo (formato padrao)
        expect(typeof resultado).toBe('string');
        expect(resultado.length).toBeGreaterThan(0);
    });
});
