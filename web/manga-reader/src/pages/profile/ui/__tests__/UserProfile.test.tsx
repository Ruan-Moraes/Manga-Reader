import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import UserProfile from '../UserProfile';

const buildProfileData = (isOwn: boolean) => ({
    loading: false,
    error: null,
    isOwn,
    profile: {
        handle: isOwn ? '@leitor_br' : '@darkfan92',
        name: isOwn ? 'Leitor BR' : 'darkfan92',
        bio: 'Leitor voraz de seinen.',
        verified: false,
        worksRead: 12,
        reviews: 4,
        followers: 10,
        following: 8,
        genres: ['Seinen'],
        isOwn,
    },
    readingNow: [],
    completed: [],
    reviews: [],
    recommendations: [],
    recentComments: [],
    groupsFollowed: [],
    activity: [],
});

const mockUseProfileData = vi.fn((_userId?: string) => buildProfileData(true));

vi.mock('../../model/useProfileData', () => ({
    default: (userId?: string) => mockUseProfileData(userId),
}));

describe('UserProfile', () => {
    beforeEach(() => {
        mockUseProfileData.mockReturnValue(buildProfileData(true));
    });

    it('shows own profile by default (no param)', () => {
        renderWithProviders(<UserProfile />);
        expect(screen.getByText('Leitor BR')).toBeInTheDocument();
        expect(screen.getByText('@leitor_br')).toBeInTheDocument();
    });

    it('shows edit button on own profile', () => {
        renderWithProviders(<UserProfile />);
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
    });

    it('shows follow button on other profile', () => {
        mockUseProfileData.mockReturnValue(buildProfileData(false));
        renderWithProviders(<UserProfile />);
        expect(screen.getByText('darkfan92')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /seguir/i })).toBeInTheDocument();
    });

    it('renders profile tabs', () => {
        renderWithProviders(<UserProfile />);
        expect(screen.getByRole('tab', { name: /visão geral/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /lendo agora/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /concluídos/i })).toBeInTheDocument();
    });

    it('switches to reviews tab', async () => {
        const user = userEvent.setup();
        renderWithProviders(<UserProfile />);

        const reviewsTab = screen.getByRole('tab', { name: /resenhas/i });
        await user.click(reviewsTab);

        expect(reviewsTab).toHaveAttribute('aria-selected', 'true');
    });
});
