import { describe, it, expect, vi, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import type { EventData } from '../type/event.types';

import {
    getEvents,
    getEventById,
    getRelatedEvents,
    statusLabel,
    formatEventDate,
    filterEvents,
} from './eventService';

const buildEvent = (overrides: Partial<EventData> = {}): EventData => ({
    id: 'event-1',
    title: 'Manga Convention',
    description: 'Grande evento',
    type: 'Convenção',
    cover: 'cover.jpg',
    startDate: '2025-07-01T10:00:00Z',
    endDate: '2025-07-02T18:00:00Z',
    location: { label: 'Centro SP', city: 'Sao Paulo', state: 'SP' },
    status: 'registrations_open',
    timeline: 'upcoming',
    participants: 500,
    interested: 200,
    isFeatured: false,
    isCreatedByMe: false,
    amIParticipating: false,
    isSaved: false,
    tags: ['manga'],
    organizer: { name: 'Org', avatar: 'org.jpg' },
    ...overrides,
});

const buildPageResponse = (content: unknown[] = []) => ({
    content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    last: true,
});

describe('eventService', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getEvents', () => {
        it('deve retornar pagina de eventos', async () => {
            server.use(
                http.get(`*${API_URLS.EVENTS}`, () =>
                    HttpResponse.json({
                        data: buildPageResponse([buildEvent()]),
                        success: true,
                    }),
                ),
            );

            const result = await getEvents();

            expect(result.content).toHaveLength(1);
        });
    });

    describe('getEventById', () => {
        it('deve retornar evento pelo id', async () => {
            server.use(
                http.get(`*${API_URLS.EVENTS}/event-1`, () =>
                    HttpResponse.json({ data: buildEvent(), success: true }),
                ),
            );

            const result = await getEventById('event-1');

            expect(result.title).toBe('Manga Convention');
        });
    });

    describe('getRelatedEvents', () => {
        it('deve retornar eventos relacionados', async () => {
            server.use(
                http.get(`*${API_URLS.EVENTS}/event-1/related`, () =>
                    HttpResponse.json({
                        data: [buildEvent({ id: 'event-2' })],
                        success: true,
                    }),
                ),
            );

            const result = await getRelatedEvents('event-1');

            expect(result).toHaveLength(1);
        });
    });

    describe('statusLabel', () => {
        it('deve mapear todos os status', () => {
            expect(statusLabel.happening_now).toBe('Acontecendo Agora');
            expect(statusLabel.registrations_open).toBe('Inscrições Abertas');
            expect(statusLabel.coming_soon).toBe('Em Breve');
            expect(statusLabel.ended).toBe('Encerrado');
        });
    });

    describe('formatEventDate', () => {
        it('deve formatar data em portugues', () => {
            const result = formatEventDate('2025-07-01T10:00:00Z');

            expect(result).toContain('2025');
        });
    });

    describe('filterEvents', () => {
        it('deve filtrar por tab upcoming', () => {
            const events = [
                buildEvent({ timeline: 'upcoming' }),
                buildEvent({ id: 'e2', timeline: 'past' }),
            ];

            const result = filterEvents(events, {
                tab: 'upcoming',
                query: '',
                type: 'all',
                period: 'all',
                sort: 'date',
                isLoggedIn: false,
            });

            expect(result).toHaveLength(1);
            expect(result[0].timeline).toBe('upcoming');
        });

        it('deve filtrar por tipo de evento', () => {
            const events = [
                buildEvent({ type: 'Convenção' }),
                buildEvent({ id: 'e2', type: 'Live' }),
            ];

            const result = filterEvents(events, {
                tab: 'upcoming',
                query: '',
                type: 'Convenção',
                period: 'all',
                sort: 'date',
                isLoggedIn: false,
            });

            expect(result).toHaveLength(1);
        });

        it('deve ordenar por popularidade', () => {
            const events = [
                buildEvent({ id: 'e1', participants: 100, interested: 50, timeline: 'upcoming' }),
                buildEvent({ id: 'e2', participants: 500, interested: 200, timeline: 'upcoming' }),
            ];

            const result = filterEvents(events, {
                tab: 'upcoming',
                query: '',
                type: 'all',
                period: 'all',
                sort: 'popularity',
                isLoggedIn: false,
            });

            expect(result[0].id).toBe('e2');
        });
    });
});
