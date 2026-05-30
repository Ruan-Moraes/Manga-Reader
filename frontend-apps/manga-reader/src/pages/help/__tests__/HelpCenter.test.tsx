import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import HelpCenter from '../HelpCenter';

describe('HelpCenter', () => {
    it('renders h1', () => {
        renderWithProviders(<HelpCenter />);
        expect(
            screen.getByRole('heading', {
                name: /como podemos ajudar/i,
                level: 1,
            }),
        ).toBeInTheDocument();
    });

    it('renders search field', () => {
        renderWithProviders(<HelpCenter />);
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('renders popular chips', () => {
        renderWithProviders(<HelpCenter />);
        expect(screen.getByRole('button', { name: /mudar idioma/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /importar mal/i })).toBeInTheDocument();
    });

    it('sets query when chip clicked', async () => {
        const user = userEvent.setup();
        renderWithProviders(<HelpCenter />);
        await user.click(screen.getByRole('button', { name: /mudar idioma/i }));
        const input = screen.getByRole('searchbox') as HTMLInputElement;
        expect(input.value).toBe('Mudar idioma');
    });

    it('renders status banner', () => {
        renderWithProviders(<HelpCenter />);
        expect(screen.getByText(/tudo operando normalmente/i)).toBeInTheDocument();
    });

    it('renders categories section', () => {
        renderWithProviders(<HelpCenter />);
        expect(screen.getByRole('heading', { name: /categorias/i })).toBeInTheDocument();
        // "Conta" appears multiple times (category label + article badges)
        expect(screen.getAllByText('Conta').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Leitura').length).toBeGreaterThan(0);
    });

    it('shows popular articles by default', () => {
        renderWithProviders(<HelpCenter />);
        expect(screen.getByRole('heading', { name: /artigos populares/i })).toBeInTheDocument();
        expect(screen.getByText(/como mudar meu e-mail ou senha/i)).toBeInTheDocument();
    });

    it('filters articles by search query', async () => {
        const user = userEvent.setup();
        renderWithProviders(<HelpCenter />);
        await user.type(screen.getByRole('searchbox'), 'senha');
        expect(screen.getByText(/como mudar meu e-mail ou senha/i)).toBeInTheDocument();
        expect(screen.queryByText(/o aplicativo está lento/i)).not.toBeInTheDocument();
    });

    it('shows empty state on no results', async () => {
        const user = userEvent.setup();
        renderWithProviders(<HelpCenter />);
        await user.type(screen.getByRole('searchbox'), 'xyzxyzxyz nada aqui');
        expect(screen.getByText(/nada encontrado/i)).toBeInTheDocument();
    });

    it('renders FAQ accordion items', () => {
        renderWithProviders(<HelpCenter />);
        expect(screen.getByRole('heading', { name: /perguntas frequentes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /o manga reader é gratuito/i })).toBeInTheDocument();
    });

    it('expands FAQ item on click', async () => {
        const user = userEvent.setup();
        renderWithProviders(<HelpCenter />);
        const faqBtn = screen.getByRole('button', {
            name: /o manga reader é gratuito/i,
        });
        await user.click(faqBtn);
        expect(screen.getByText(/leitura básica é totalmente gratuita/i)).toBeVisible();
    });

    it('renders system status section', () => {
        renderWithProviders(<HelpCenter />);
        expect(screen.getByRole('heading', { name: /status do sistema/i })).toBeInTheDocument();
        const statusItems = screen.getAllByRole('status');
        expect(statusItems.length).toBeGreaterThan(0);
    });

    it('renders CTA card with falar com o time', () => {
        renderWithProviders(<HelpCenter />);
        expect(screen.getByRole('heading', { name: /falar com o time/i })).toBeInTheDocument();
    });
});
