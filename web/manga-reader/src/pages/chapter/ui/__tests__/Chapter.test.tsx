import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { createTestQueryClient } from '@/test/helpers/renderWithProviders';

import Chapter from '../Chapter';

const renderChapter = (titleId = '1', chapter = '1') => {
    const client = createTestQueryClient();

    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[`/titles/${titleId}/chapters/${chapter}`]}>
                <Routes>
                    <Route path="/titles/:titleId/chapters/:chapter" element={<Chapter />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
};

describe('Chapter (Reader)', () => {
    it('renders main landmark', () => {
        renderChapter();
        expect(screen.getByRole('main', { name: /leitor de mangá/i })).toBeInTheDocument();
    });

    it('renders reader toolbar', () => {
        renderChapter();
        expect(screen.getByRole('toolbar', { name: /controles do leitor/i })).toBeInTheDocument();
    });

    it('renders back button', () => {
        renderChapter();
        expect(screen.getAllByRole('button', { name: /voltar/i }).length).toBeGreaterThan(0);
    });

    it('renders save bookmark button', () => {
        renderChapter();
        expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
    });

    it('renders settings button', () => {
        renderChapter();
        expect(screen.getByRole('button', { name: /configurações/i })).toBeInTheDocument();
    });

    it('renders title name when titleId=1', () => {
        renderChapter('1', '1');
        expect(screen.getByText('Berserk')).toBeInTheDocument();
    });

    it('renders chapter and page info', () => {
        renderChapter('1', '5');
        expect(screen.getByText(/cap\. 5/i)).toBeInTheDocument();
    });

    it('renders page slider', () => {
        renderChapter();
        expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('renders page images in vertical mode (default)', () => {
        renderChapter();
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
    });

    it('opens settings drawer on settings button click', async () => {
        const user = userEvent.setup();

        renderChapter();

        await user.click(screen.getByRole('button', { name: /configurações/i }));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});
