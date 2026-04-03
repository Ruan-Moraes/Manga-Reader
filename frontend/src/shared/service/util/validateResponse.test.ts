import { describe, it, expect } from 'vitest';

import validateResponse from './validateResponse';

describe('validateResponse', () => {
    it('nao deve lancar erro para response ok', () => {
        const response = { ok: true, statusText: 'OK' } as Response;

        expect(() => validateResponse(response)).not.toThrow();
    });

    it('deve lancar erro para response nao ok', () => {
        const response = {
            ok: false,
            statusText: 'Not Found',
        } as Response;

        expect(() => validateResponse(response)).toThrow('Not Found');
    });

    it('deve lancar erro com mensagem padrao quando statusText e vazio', () => {
        const response = { ok: false, statusText: '' } as Response;

        expect(() => validateResponse(response)).toThrow(
            'Resposta inválida da API',
        );
    });

    it('deve lancar erro para response null', () => {
        expect(() => validateResponse(null as unknown as Response)).toThrow();
    });

    it('deve lancar erro para response undefined', () => {
        expect(() =>
            validateResponse(undefined as unknown as Response),
        ).toThrow();
    });
});
