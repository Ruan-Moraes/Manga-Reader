import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import type { Review } from '@entities/review';
import UserProfile from '../UserProfile';

const mockReview: Review = {
    id: 'review-1',
    titleId: 'title-1',
    titleName: 'Berserk',
    userId: 'user-1',
    userName: 'Leitor BR',
    overallRating: 4.5,
    funRating: 4,
    artRating: 5,
    storylineRating: 5,
    charactersRating: 4.5,
    originalityRating: 4,
    pacingRating: 4,
    comment: 'Conteúdo com spoiler.',
    reviewTitle: 'Um clássico',
    createdAt: '2026-06-12T12:00:00Z',
    updatedAt: '2026-06-13T12:00:00Z',
    edited: true,
    spoiler: true,
    cover: 'https://example.com/berserk.jpg',
    genres: ['Seinen'],
};

const buildProfileData = (isOwn: boolean, reviews: Review[] = []) => ({
    loading: false,
    error: null,
    isOwn,
    profileUserId: 'user-1',
    isFollowedByMe: false,
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
    reviews,
    recommendations: [],
    recentComments: [],
    groupsFollowed: [],
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

    it('renders reviews with the same work-centered structure used by /reviews', async () => {
        const user = userEvent.setup();
        mockUseProfileData.mockReturnValue(buildProfileData(true, [mockReview]));

        renderWithProviders(<UserProfile />);

        const card = screen.getByRole('article');
        expect(within(card).getByRole('button', { name: 'Berserk' })).toBeInTheDocument();
        expect(card.querySelector('img')).toHaveAttribute('src', mockReview.cover);
        expect(within(card).getByText('Seinen')).toBeInTheDocument();
        expect(within(card).getByText('Um clássico')).toBeInTheDocument();
        expect(within(card).getByText('(editado)')).toBeInTheDocument();
        expect(within(card).getByRole('button', { name: 'Editar' })).toBeInTheDocument();
        expect(within(card).getByRole('button', { name: 'Excluir' })).toBeInTheDocument();

        const time = within(card).getByText(/^há /);
        expect(time).toHaveAttribute('title');
        expect(time.getAttribute('title')).not.toBe('');

        await user.click(within(card).getByRole('button', { name: /mostrar spoiler/i }));
        expect(within(card).getByText('Conteúdo com spoiler.')).toBeInTheDocument();
    });

    it('does not expose owner actions on another user profile', () => {
        mockUseProfileData.mockReturnValue(buildProfileData(false, [mockReview]));

        renderWithProviders(<UserProfile />);

        const card = screen.getByRole('article');
        expect(within(card).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
        expect(within(card).queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
    });
});
