import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test/mocks/server';

import { reportError } from '../errorReportingService';

const AUTH_STORAGE_KEY = 'manga-reader:auth-user';

describe('errorReportingService', () => {
    let capturedBodies: Record<string, unknown>[] = [];

    beforeEach(() => {
        capturedBodies = [];

        server.use(
            http.post('*/api/error-logs', async ({ request }) => {
                capturedBodies.push(
                    (await request.json()) as Record<string, unknown>,
                );
                return HttpResponse.json(
                    { data: { id: 'err-1' }, success: true },
                    { status: 201 },
                );
            }),
        );
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('deve enviar POST com payload correto', async () => {
        reportError('Test error POST', 'Error: stack trace', 'error-boundary');

        await vi.waitFor(() => {
            expect(capturedBodies).toHaveLength(1);
        });

        expect(capturedBodies[0]).toMatchObject({
            message: 'Test error POST',
            stackTrace: 'Error: stack trace',
            source: 'error-boundary',
            userAgent: expect.any(String),
        });
    });

    it('deve incluir userId quando session existe', async () => {
        localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({ userId: 'user-abc', accessToken: 'tok' }),
        );

        reportError('Error with user', null, 'window-error');

        await vi.waitFor(() => {
            expect(capturedBodies).toHaveLength(1);
        });

        expect(capturedBodies[0]?.userId).toBe('user-abc');
    });

    it('deve enviar userId null quando nao ha session', async () => {
        reportError('Error no session', null, 'unhandled-rejection');

        await vi.waitFor(() => {
            expect(capturedBodies).toHaveLength(1);
        });

        expect(capturedBodies[0]?.userId).toBeNull();
    });

    it('nao deve lancar erro quando request falha', async () => {
        server.use(
            http.post('*/api/error-logs', () => {
                return HttpResponse.error();
            }),
        );

        expect(() => {
            reportError('Error network fail', null, 'error-boundary');
        }).not.toThrow();
    });

    it('deve deduplicar erros identicos dentro da janela de 5s', async () => {
        reportError('Duplicate error', null, 'error-boundary');
        reportError('Duplicate error', null, 'error-boundary');
        reportError('Duplicate error', null, 'error-boundary');

        await vi.waitFor(() => {
            expect(capturedBodies).toHaveLength(1);
        });

        // Aguardar um pouco para confirmar que nao chegam mais
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(capturedBodies).toHaveLength(1);
    });

    it('deve permitir erros com mensagens diferentes', async () => {
        reportError('Error A', null, 'error-boundary');
        reportError('Error B', null, 'error-boundary');

        await vi.waitFor(() => {
            expect(capturedBodies).toHaveLength(2);
        });
    });
});
