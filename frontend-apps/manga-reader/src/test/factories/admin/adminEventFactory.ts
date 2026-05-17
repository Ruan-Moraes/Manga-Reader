import type { AdminEvent } from '@feature/admin/type/admin.types';
import type { LocalizedString } from '@shared/type/i18n';
import type { PageResponse } from '@shared/service/http';

import { buildPage } from '../pageFactory';

const loc = (value: string): LocalizedString => ({ 'pt-BR': value });

let adminEventCounter = 0;

export const buildAdminEvent = (
    overrides: Partial<AdminEvent> = {},
): AdminEvent => {
    adminEventCounter += 1;

    return {
        id: `admin-event-${adminEventCounter}`,
        title: loc(`Evento Admin ${adminEventCounter}`),
        subtitle: loc('Subtitulo do evento'),
        description: loc('Descricao detalhada do evento.'),
        image: `/events/admin-${adminEventCounter}.jpg`,
        startDate: '2026-05-15T10:00:00Z',
        endDate: '2026-05-17T22:00:00Z',
        timezone: 'America/Sao_Paulo',
        timeline: 'upcoming',
        status: 'registrations_open',
        type: 'Convenção',
        locationLabel: 'Centro de Convencoes',
        locationCity: 'Sao Paulo',
        locationIsOnline: false,
        organizerName: 'Organizador Admin',
        priceLabel: 'R$ 50,00',
        participants: 250,
        interested: 1000,
        isFeatured: false,
        createdAt: '2025-12-01T10:00:00Z',
        updatedAt: null,
        ...overrides,
    };
};

export const adminEventPresets = {
    happeningNow: () =>
        buildAdminEvent({ status: 'happening_now', timeline: 'ongoing' }),
    registrationsOpen: () =>
        buildAdminEvent({
            status: 'registrations_open',
            timeline: 'upcoming',
        }),
    comingSoon: () =>
        buildAdminEvent({ status: 'coming_soon', timeline: 'upcoming' }),
    ended: () => buildAdminEvent({ status: 'ended', timeline: 'past' }),

    online: () =>
        buildAdminEvent({
            locationIsOnline: true,
            locationLabel: 'Plataforma Online',
            locationCity: null,
        }),
    presencial: () => buildAdminEvent({ locationIsOnline: false }),

    convencao: () => buildAdminEvent({ type: 'Convenção' }),
    lancamento: () => buildAdminEvent({ type: 'Lançamento' }),
    live: () => buildAdminEvent({ type: 'Live' }),
    workshop: () => buildAdminEvent({ type: 'Workshop' }),
    meetup: () => buildAdminEvent({ type: 'Meetup' }),

    featured: () => buildAdminEvent({ isFeatured: true }),

    minimal: () =>
        buildAdminEvent({
            subtitle: {},
            description: {},
            image: null,
            timezone: null,
            locationLabel: null,
            locationCity: null,
            organizerName: null,
            priceLabel: null,
            participants: 0,
            interested: 0,
            updatedAt: null,
        }),

    massive: () => buildAdminEvent({ participants: 50000, interested: 200000 }),
};

export const buildAdminEventList = (count = 10): AdminEvent[] =>
    Array.from({ length: count }, () => buildAdminEvent());

export const buildAdminEventPage = (
    items: AdminEvent[] = buildAdminEventList(),
    page = 0,
    size = 20,
): PageResponse<AdminEvent> => buildPage(items, page, size);
