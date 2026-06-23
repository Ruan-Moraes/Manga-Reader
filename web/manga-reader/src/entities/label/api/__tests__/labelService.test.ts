import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import { getDomainLabels, getDomainLabelsAdmin } from '../labelService';

describe('labelService', () => {
    describe('getDomainLabels', () => {
        it('deve retornar lista de labels para o tipo informado', async () => {
            server.use(
                http.get(`*${API_URLS.LABELS}`, () =>
                    HttpResponse.json({
                        data: [
                            {
                                value: 'publication_status',
                                label: 'Em Publicação',
                            },
                            { value: 'completed', label: 'Concluído' },
                        ],
                        success: true,
                    }),
                ),
            );

            const result = await getDomainLabels('publication_status');

            expect(result).toHaveLength(2);
            expect(result[0].value).toBe('publication_status');
            expect(result[0].label).toBe('Em Publicação');
        });

        it('deve lançar erro quando API retorna 500', async () => {
            server.use(http.get(`*${API_URLS.LABELS}`, () => HttpResponse.json(null, { status: 500 })));

            await expect(getDomainLabels('publication_status')).rejects.toThrow();
        });
    });

    describe('getDomainLabelsAdmin', () => {
        it('deve retornar labels admin com todos os idiomas', async () => {
            server.use(
                http.get(`*${API_URLS.LABELS}/admin`, () =>
                    HttpResponse.json({
                        data: [
                            {
                                value: 'ongoing',
                                labelI18n: {
                                    'pt-BR': 'Em Publicação',
                                    'en-US': 'Ongoing',
                                    'es-ES': 'En Publicación',
                                },
                            },
                        ],
                        success: true,
                    }),
                ),
            );

            const result = await getDomainLabelsAdmin('publication_status');

            expect(result).toHaveLength(1);
            expect(result[0].labelI18n['en-US']).toBe('Ongoing');
        });

        it('deve lançar erro quando API retorna 500', async () => {
            server.use(http.get(`*${API_URLS.LABELS}/admin`, () => HttpResponse.json(null, { status: 500 })));

            await expect(getDomainLabelsAdmin('publication_status')).rejects.toThrow();
        });
    });
});
