import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import EventDetails from '../EventDetails';
import type { EventData } from '@feature/event';
import { useEventDetails } from '@feature/event';

vi.mock('@feature/event', async importOriginal => {
    const actual = await importOriginal<typeof import('@feature/event')>();
    return { ...actual, useEventDetails: vi.fn() };
});

const mockEvent: EventData = {
    id: '2',
    title: 'Anime Friends 2025',
    subtitle: 'O maior evento de cultura japonesa do Brasil',
    description: 'Descrição do evento.',
    image: '',
    gallery: [],
    startDate: '2025-07-10T10:00:00',
    endDate: '2025-07-13T22:00:00',
    timezone: 'America/Sao_Paulo',
    timeline: 'upcoming',
    status: 'coming_soon',
    type: 'Convenção',
    location: {
        label: 'Expo Center Norte',
        address: 'Rua X',
        city: 'São Paulo',
        isOnline: false,
        mapLink: '',
        directions: '',
    },
    organizer: {
        id: 'org1',
        name: 'Anime Friends',
        avatar: '',
        profileLink: '/groups/1',
        contact: '',
    },
    priceLabel: 'A partir de R$ 50',
    participants: 3200,
    interested: 1450,
    schedule: [],
    specialGuests: [],
    socialLinks: {},
    comments: [],
    relatedEventIds: [],
};

describe('EventDetails', () => {
    beforeEach(() => {
        vi.mocked(useEventDetails).mockReturnValue({
            event: mockEvent,
            relatedEvents: [],
            isLoading: false,
            isError: false,
        });
    });

    it('renders event heading', () => {
        renderWithProviders(<EventDetails />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Anime Friends 2025');
    });

    it('renders event by id param', () => {
        renderWithProviders(<EventDetails />);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('shows loading skeleton when loading', () => {
        vi.mocked(useEventDetails).mockReturnValue({
            event: null,
            relatedEvents: [],
            isLoading: true,
            isError: false,
        });
        const { container } = renderWithProviders(<EventDetails />);
        expect(container.querySelector('[class*="animate-pulse"]')).toBeTruthy();
    });

    it('shows empty state on error', () => {
        vi.mocked(useEventDetails).mockReturnValue({
            event: null,
            relatedEvents: [],
            isLoading: false,
            isError: true,
        });
        renderWithProviders(<EventDetails />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows event type badge', () => {
        renderWithProviders(<EventDetails />);
        expect(screen.getByText('Convenção')).toBeInTheDocument();
    });
});
