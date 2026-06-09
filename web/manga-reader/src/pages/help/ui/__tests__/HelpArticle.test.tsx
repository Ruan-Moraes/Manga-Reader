import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HelpArticle from '../HelpArticle';

const renderAt = (path: string) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/help/article/:articleId" element={<HelpArticle />} />
            </Routes>
        </MemoryRouter>,
    );

describe('HelpArticle', () => {
    it('renders the article title for a known id', () => {
        renderAt('/help/article/1');
        expect(screen.getByRole('heading', { name: 'Como mudar meu e-mail ou senha?' })).toBeInTheDocument();
    });

    it('renders the article body paragraphs', () => {
        renderAt('/help/article/1');
        expect(screen.getByText(/Configurações → Conta/)).toBeInTheDocument();
    });

    it('renders as a main landmark', () => {
        renderAt('/help/article/1');
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('lists related articles from the same category', () => {
        // article 1 (account) has sibling article 3 (account)
        renderAt('/help/article/1');
        expect(screen.getByText('Esqueci minha senha — como recuperar?')).toBeInTheDocument();
    });

    it('shows a not-found state for an unknown id', () => {
        renderAt('/help/article/999');
        expect(screen.getByText('Artigo não encontrado')).toBeInTheDocument();
    });
});
