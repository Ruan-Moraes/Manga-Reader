import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type EventType, type EventData } from '../type/event.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventFilters = {
    tab: 'upcoming' | 'ongoing' | 'past' | 'my-events';
    query: string;
    type: 'all' | EventType;
    period: 'all' | 'today' | 'week' | 'month';
    sort: 'date' | 'popularity' | 'relevance';
    isLoggedIn: boolean;
};

// ---------------------------------------------------------------------------
// Public API — Async (chamadas ao backend)
// ---------------------------------------------------------------------------

export const getEvents = async (
    page = 0,
    size = 20,
): Promise<PageResponse<EventData>> => {
    const response = await api.get<ApiResponse<PageResponse<EventData>>>(
        API_URLS.EVENTS,
        { params: { page, size } },
    );

    return response.data.data;
};

export const getEventById = async (id: string): Promise<EventData> => {
    const response = await api.get<ApiResponse<EventData>>(
        `${API_URLS.EVENTS}/${id}`,
    );

    return response.data.data;
};

export const getRelatedEvents = async (
    eventId: string,
): Promise<EventData[]> => {
    const response = await api.get<ApiResponse<EventData[]>>(
        `${API_URLS.EVENTS}/${eventId}/related`,
    );

    return response.data.data;
};

export const eventTypes: EventType[] = [
    'Convenção',
    'Lançamento',
    'Live',
    'Workshop',
    'Meetup',
];

export const statusLabelKey: Record<EventData['status'], string> = {
    happening_now: 'status.happening_now',
    registrations_open: 'status.registrations_open',
    coming_soon: 'status.coming_soon',
    ended: 'status.ended',
};

export const formatEventDate = (date: string) =>
    new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));

// ---------------------------------------------------------------------------
// Sync filter — usado pelos componentes de rota em useMemo
// ---------------------------------------------------------------------------

export const filterEvents = (
    items: EventData[],
    filters: EventFilters,
): EventData[] => {
    const { tab, query, type, period, sort, isLoggedIn } = filters;
    const normalizedQuery = query.trim().toLowerCase();
    const now = Date.now();

    const byTab = items.filter(event => {
        if (tab === 'my-events') {
            return (
                isLoggedIn &&
                (event.isCreatedByMe || event.amIParticipating || event.isSaved)
            );
        }
        return event.timeline === tab;
    });

    const byQuery = byTab.filter(event => {
        const haystack =
            `${event.title} ${event.location.label} ${event.location.city}`.toLowerCase();
        return haystack.includes(normalizedQuery);
    });

    const byType =
        type === 'all' ? byQuery : byQuery.filter(e => e.type === type);

    const byPeriod = byType.filter(event => {
        if (period === 'all') return true;
        const eventDate = new Date(event.startDate).getTime();
        if (period === 'today')
            return (
                new Date(event.startDate).toDateString() ===
                new Date().toDateString()
            );
        if (period === 'week')
            return eventDate >= now && eventDate <= now + 7 * 86_400_000;
        return eventDate >= now && eventDate <= now + 31 * 86_400_000;
    });

    return [...byPeriod].sort((a, b) => {
        if (sort === 'date')
            return (
                new Date(a.startDate).getTime() -
                new Date(b.startDate).getTime()
            );
        if (sort === 'popularity')
            return (
                b.participants + b.interested - (a.participants + a.interested)
            );
        const aR =
            Number(a.isFeatured) + Number(a.amIParticipating) + a.interested;
        const bR =
            Number(b.isFeatured) + Number(b.amIParticipating) + b.interested;
        return bR - aR;
    });
};
