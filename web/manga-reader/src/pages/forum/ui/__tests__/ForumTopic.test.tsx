import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import ForumTopic from '../ForumTopic';

const renderWithTopic = (topicId: string) => {
    const client = createTestQueryClient();
    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[`/forum/${topicId}`]}>
                <Routes>
                    <Route path="/forum/:topicId" element={<ForumTopic />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
};

describe('ForumTopic', () => {
    it('shows default topic (id=2) when no param', () => {
        renderWithProviders(<ForumTopic />);
        expect(screen.getByRole('heading', { name: /poll: qual o melhor arco/i })).toBeInTheDocument();
    });

    it('shows topic by id', () => {
        renderWithTopic('3');
        expect(screen.getByRole('heading', { name: /teoria: o que aconteceu/i })).toBeInTheDocument();
    });

    it('renders replies list', () => {
        renderWithProviders(<ForumTopic />);
        expect(screen.getByText(/marineford sem dúvida/i)).toBeInTheDocument();
    });

    it('shows reply textarea', () => {
        renderWithProviders(<ForumTopic />);
        expect(screen.getByLabelText(/sua resposta/i)).toBeInTheDocument();
    });

    it('enables publish button only when reply has content', async () => {
        const user = userEvent.setup();
        renderWithProviders(<ForumTopic />);

        const textarea = screen.getByLabelText(/sua resposta/i);
        const publishBtn = screen.getByRole('button', { name: /publicar/i });

        expect(publishBtn).toBeDisabled();

        await user.type(textarea, 'Meu comentário aqui');
        expect(publishBtn).not.toBeDisabled();
    });

    it('shows back navigation button', () => {
        renderWithProviders(<ForumTopic />);
        expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
    });
});
