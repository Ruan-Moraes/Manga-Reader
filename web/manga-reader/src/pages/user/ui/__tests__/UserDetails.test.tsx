import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import UserDetails from '../UserDetails';

vi.mock('@entities/user', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/user')>();
    return { ...actual, useUserDetails: vi.fn() };
});

vi.mock('@features/auth', async importOriginal => {
    const actual = await importOriginal<typeof import('@features/auth')>();
    return { ...actual, useAuth: vi.fn() };
});

import { useUserDetails } from '@entities/user';
import { useAuth } from '@features/auth';

const mockUser = {
    id: 'u1',
    name: 'Fulano Silva',
    photo: '',
    bio: 'Leitor ávido.',
    role: 'reader' as const,
    statistics: { comments: 10, likes: 5, dislikes: 1 },
    socialMediasLinks: [],
    recommendedTitles: [],
};

describe('UserDetails', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<UserDetails />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    beforeEach(() => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            isLoggedIn: false,
            isInitializing: false,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            setUser: vi.fn(),
        });
        vi.mocked(useUserDetails).mockReturnValue({
            user: mockUser,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useUserDetails>);
    });

    it('renders user name', () => {
        renderWithProviders(<UserDetails />);
        expect(screen.getAllByText('Fulano Silva').length).toBeGreaterThan(0);
    });

    it('renders user bio', () => {
        renderWithProviders(<UserDetails />);
        expect(screen.getByText('Leitor ávido.')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        vi.mocked(useUserDetails).mockReturnValue({
            user: null,
            isLoading: true,
        } as ReturnType<typeof useUserDetails>);
        renderWithProviders(<UserDetails />);
        expect(screen.getByText(/carregando perfil/i)).toBeInTheDocument();
    });

    it('shows not-found when no user', () => {
        vi.mocked(useUserDetails).mockReturnValue({
            user: null,
            isLoading: false,
        } as ReturnType<typeof useUserDetails>);
        renderWithProviders(<UserDetails />);
        expect(screen.getByText(/usuário não encontrado/i)).toBeInTheDocument();
    });

    it('shows reader role label', () => {
        renderWithProviders(<UserDetails />);
        expect(screen.getAllByText(/leitor/i).length).toBeGreaterThan(0);
    });
});
