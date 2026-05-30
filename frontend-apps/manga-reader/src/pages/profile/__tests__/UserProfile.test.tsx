import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import UserProfile from '../UserProfile';

const renderWithHandle = (handle: string) => {
    const client = createTestQueryClient();
    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[`/u/${handle}`]}>
                <Routes>
                    <Route path="/u/:handle" element={<UserProfile />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
};

describe('UserProfile', () => {
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
        renderWithHandle('darkfan92');
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
