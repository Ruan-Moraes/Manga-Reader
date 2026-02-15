import { simulateDelay } from '@shared/service/mockApi';
import { mockEvents } from '@mock/data/events';

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
// Public API
// ---------------------------------------------------------------------------

export const getEvents = async (filters?: EventFilters): Promise<EventData[]> => {
    await simulateDelay();

    if (!filters) return mockEvents;

    const { tab, query, type, period, sort, isLoggedIn } = filters;
    const normalizedQuery = query.trim().toLowerCase();
    const now = Date.now();

    const byTab = mockEvents.filter(event => {
        if (tab === 'my-events') {
            return isLoggedIn && (event.isCreatedByMe || event.amIParticipating || event.isSaved);
        }
        return event.timeline === tab;
    });

    const byQuery = byTab.filter(event => {
        const haystack = `${event.title} ${event.location.label} ${event.location.city}`.toLowerCase();
        return haystack.includes(normalizedQuery);
    });

    const byType = type === 'all' ? byQuery : byQuery.filter(e => e.type === type);

    const byPeriod = byType.filter(event => {
        if (period === 'all') return true;
        const eventDate = new Date(event.startDate).getTime();
        if (period === 'today') return new Date(event.startDate).toDateString() === new Date().toDateString();
        if (period === 'week') return eventDate >= now && eventDate <= now + 7 * 86_400_000;
        return eventDate >= now && eventDate <= now + 31 * 86_400_000;
    });

    return [...byPeriod].sort((a, b) => {
        if (sort === 'date') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        if (sort === 'popularity') return (b.participants + b.interested) - (a.participants + a.interested);
        const aR = Number(a.isFeatured) + Number(a.amIParticipating) + a.interested;
        const bR = Number(b.isFeatured) + Number(b.amIParticipating) + b.interested;
        return bR - aR;
    });
};

export const getEventById = (id: string): EventData | undefined =>
    mockEvents.find(e => e.id === id);

export const getRelatedEvents = (event: EventData): EventData[] =>
    mockEvents.filter(e => event.relatedEventIds.includes(e.id)).slice(0, 4);

export const eventTypes: EventType[] = [
    'Convenção', 'Lançamento', 'Live', 'Workshop', 'Meetup',
];

export const statusLabel: Record<EventData['status'], string> = {
    happening_now: 'Acontecendo Agora',
    registrations_open: 'Inscrições Abertas',
    coming_soon: 'Em Breve',
    ended: 'Encerrado',
};

// ---------------------------------------------------------------------------
// Sync filter — usado pelos componentes de rota em useMemo
// ---------------------------------------------------------------------------

export const filterEvents = (filters: EventFilters): EventData[] => {
    const { tab, query, type, period, sort, isLoggedIn } = filters;
    const normalizedQuery = query.trim().toLowerCase();
    const now = Date.now();

    const byTab = mockEvents.filter(event => {
        if (tab === 'my-events') {
            return isLoggedIn && (event.isCreatedByMe || event.amIParticipating || event.isSaved);
        }
        return event.timeline === tab;
    });

    const byQuery = byTab.filter(event => {
        const haystack = `${event.title} ${event.location.label} ${event.location.city}`.toLowerCase();
        return haystack.includes(normalizedQuery);
    });

    const byType = type === 'all' ? byQuery : byQuery.filter(e => e.type === type);

    const byPeriod = byType.filter(event => {
        if (period === 'all') return true;
        const eventDate = new Date(event.startDate).getTime();
        if (period === 'today') return new Date(event.startDate).toDateString() === new Date().toDateString();
        if (period === 'week') return eventDate >= now && eventDate <= now + 7 * 86_400_000;
        return eventDate >= now && eventDate <= now + 31 * 86_400_000;
    });

    return [...byPeriod].sort((a, b) => {
        if (sort === 'date') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        if (sort === 'popularity') return (b.participants + b.interested) - (a.participants + a.interested);
        const aR = Number(a.isFeatured) + Number(a.amIParticipating) + a.interested;
        const bR = Number(b.isFeatured) + Number(b.amIParticipating) + b.interested;
        return bR - aR;
    });
};
