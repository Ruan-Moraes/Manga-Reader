import { describe, it, expect } from 'vitest';

import {
    resolveApiErrorMessage,
    isAuthExpiredError,
    isValidationError,
    API_ERROR_CODES,
} from './apiErrorMessages';

describe('resolveApiErrorMessage', () => {
    it('deve retornar mensagem mapeada quando code e reconhecido', () => {
        const mensagem = resolveApiErrorMessage(
            API_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        );

        expect(mensagem).toBe(
            'Email ou senha incorretos. Verifique seus dados e tente novamente.',
        );
    });

    it('deve retornar serverMessage quando code nao e reconhecido', () => {
        const mensagem = resolveApiErrorMessage(
            'UNKNOWN_CODE',
            undefined,
            'Mensagem do servidor',
        );

        expect(mensagem).toBe('Mensagem do servidor');
    });

    it('deve retornar fallback por HTTP status quando sem code e sem serverMessage', () => {
        const mensagem = resolveApiErrorMessage(undefined, 404);

        expect(mensagem).toBe(
            'O item que você procura não foi encontrado.',
        );
    });

    it('deve agrupar erros 5xx no fallback de 500', () => {
        const mensagem = resolveApiErrorMessage(undefined, 504);

        expect(mensagem).toBe(
            'Erro interno do servidor. Tente novamente mais tarde.',
        );
    });

    it('deve retornar mensagem generica quando sem code, serverMessage e status', () => {
        const mensagem = resolveApiErrorMessage();

        expect(mensagem).toBe(
            'Ops! Ocorreu um erro inesperado. Tente novamente mais tarde.',
        );
    });

    it('deve priorizar code sobre serverMessage', () => {
        const mensagem = resolveApiErrorMessage(
            API_ERROR_CODES.RESOURCE_NOT_FOUND,
            500,
            'Algo deu errado',
        );

        expect(mensagem).toBe(
            'O item que você procura não foi encontrado.',
        );
    });

    it('deve priorizar serverMessage sobre HTTP status', () => {
        const mensagem = resolveApiErrorMessage(
            undefined,
            500,
            'Erro customizado do backend',
        );

        expect(mensagem).toBe('Erro customizado do backend');
    });

    it('deve retornar mensagem para status 0 (sem conexao)', () => {
        const mensagem = resolveApiErrorMessage(undefined, 0);

        expect(mensagem).toBe(
            'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
        );
    });

    it('deve mapear todos os codigos de auth', () => {
        const authCodes = [
            API_ERROR_CODES.AUTH_TOKEN_EXPIRED,
            API_ERROR_CODES.AUTH_REFRESH_TOKEN_EXPIRED,
            API_ERROR_CODES.AUTH_UNAUTHENTICATED,
            API_ERROR_CODES.AUTH_ACCESS_DENIED,
            API_ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
            API_ERROR_CODES.AUTH_RESET_TOKEN_INVALID,
        ];

        for (const code of authCodes) {
            const mensagem = resolveApiErrorMessage(code);
            expect(mensagem).not.toBe(
                'Ops! Ocorreu um erro inesperado. Tente novamente mais tarde.',
            );
        }
    });
});

describe('isAuthExpiredError', () => {
    it('deve retornar true para AUTH_TOKEN_EXPIRED', () => {
        expect(isAuthExpiredError(API_ERROR_CODES.AUTH_TOKEN_EXPIRED)).toBe(
            true,
        );
    });

    it('deve retornar true para AUTH_REFRESH_TOKEN_EXPIRED', () => {
        expect(
            isAuthExpiredError(API_ERROR_CODES.AUTH_REFRESH_TOKEN_EXPIRED),
        ).toBe(true);
    });

    it('deve retornar true para AUTH_UNAUTHENTICATED', () => {
        expect(
            isAuthExpiredError(API_ERROR_CODES.AUTH_UNAUTHENTICATED),
        ).toBe(true);
    });

    it('deve retornar false para outros codigos', () => {
        expect(
            isAuthExpiredError(API_ERROR_CODES.AUTH_ACCESS_DENIED),
        ).toBe(false);
    });

    it('deve retornar false para undefined', () => {
        expect(isAuthExpiredError(undefined)).toBe(false);
    });
});

describe('isValidationError', () => {
    it('deve retornar true para VALIDATION_FIELD_ERROR', () => {
        expect(
            isValidationError(API_ERROR_CODES.VALIDATION_FIELD_ERROR),
        ).toBe(true);
    });

    it('deve retornar false para outros codigos de validacao', () => {
        expect(
            isValidationError(API_ERROR_CODES.VALIDATION_BAD_REQUEST),
        ).toBe(false);
    });

    it('deve retornar false para undefined', () => {
        expect(isValidationError(undefined)).toBe(false);
    });
});
