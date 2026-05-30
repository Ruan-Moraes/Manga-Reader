import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import Events from '../Events';
import type { EventData } from '@features/event';

const makeEvent = (overrides: Partial<EventData> = {}): EventData => ({
    id: '1',
    title: 'Default Event',
    subtitle: '',
    description: '',
    image: '',
    gallery: [],
    startDate: '2026-06-01T18:00:00Z',
    endDate: '2026-06-01T21:00:00Z',
    timezone: 'America/Sao_Paulo',
    timeline: 'upcoming',
    status: 'coming_soon',
    type: 'Meetup',
    location: {
        label: 'Online',
        address: '',
        city: 'Online',
        isOnline: true,
        mapLink: '',
        directions: '',
    },
    organizer: {
        id: 'o1',
        name: 'Org',
        avatar: '',
        profileLink: '',
        contact: '',
    },
    priceLabel: 'Gratuito',
    participants: 100,
    interested: 50,
    schedule: [],
    specialGuests: [],
    socialLinks: {},
    comments: [],
    relatedEventIds: [],
    ...overrides,
});

const MOCK_EVENTS: EventData[] = [
    makeEvent({
        id: '1',
        title: 'Lançamento Berserk Vol 42',
        type: 'Lançamento',
        timeline: 'upcoming',
        isFeatured: true,
    }),
    makeEvent({
        id: '2',
        title: 'Fan Meet São Paulo 2026',
        type: 'Meetup',
        timeline: 'upcoming',
    }),
    makeEvent({
        id: '3',
        title: 'Live: Análise JJK',
        type: 'Live',
        timeline: 'ongoing',
    }),
];

const mEvents = {
    tabs: [
        { id: 'upcoming', labelKey: 'page.tabs.upcoming' },
        { id: 'ongoing', labelKey: 'page.tabs.ongoing' },
        { id: 'past', labelKey: 'page.tabs.past' },
        { id: 'my-events', labelKey: 'page.tabs.myEvents' },
    ] as const,
    isLoggedIn: false,
    hasCreatePermission: false,
    activeTab: 'upcoming' as string,
    setActiveTab: vi.fn((v: string) => {
        mEvents.activeTab = v;
    }),
    query: '',
    setQuery: vi.fn(),
    type: 'all' as const,
    setType: vi.fn(),
    period: 'all' as const,
    setPeriod: vi.fn(),
    sort: 'date' as const,
    setSort: vi.fn(),
    events: MOCK_EVENTS,
    featured: MOCK_EVENTS[0],
};

vi.mock('@features/event', async importOriginal => {
    const actual = await importOriginal<typeof import('@features/event')>();
    return {
        ...actual,
        useEvents: () => mEvents,
    };
});

beforeEach(() => {
    mEvents.activeTab = 'upcoming';
    mEvents.events = MOCK_EVENTS;
    mEvents.featured = MOCK_EVENTS[0];
    mEvents.setActiveTab.mockClear();
});

const setup = () => renderWithProviders(<Events />);

describe('Events', () => {
    it('renders heading', () => {
        setup();
        expect(screen.getByRole('heading', { name: /eventos/i })).toBeInTheDocument();
    });

    it('shows event cards', () => {
        setup();
        expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
    });

    it('renders period SegmentedControl (próximos, em andamento, passados)', () => {
        setup();
        expect(screen.getByRole('radio', { name: /próximos/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /em andamento/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /passados/i })).toBeInTheDocument();
    });

    it('switches to passados period', async () => {
        const user = userEvent.setup();
        setup();

        const pastBtn = screen.getByRole('radio', { name: /passados/i });
        await user.click(pastBtn);

        expect(mEvents.setActiveTab).toHaveBeenCalledWith('past');
    });
});
