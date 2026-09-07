import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import Privacy from '../Privacy';

describe('Privacy', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<Privacy />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders page title', () => {
        renderWithProviders(<Privacy />);
        expect(
            screen.getByRole('heading', {
                name: /política de privacidade/i,
                level: 1,
            }),
        ).toBeInTheDocument();
    });

    it('renders all 4 legal doc tabs', () => {
        renderWithProviders(<Privacy />);
        expect(screen.getByRole('button', { name: /termos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /privacidade/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /dmca/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /contato/i })).toBeInTheDocument();
    });

    it('Privacidade tab is active', () => {
        renderWithProviders(<Privacy />);
        expect(screen.getByRole('button', { name: /privacidade/i })).toHaveAttribute('aria-current', 'page');
    });

    it('renders section headings', () => {
        renderWithProviders(<Privacy />);
        expect(screen.getAllByRole('heading', { name: /quais dados coletamos/i }).length).toBeGreaterThan(0);
    });

    it('publica a política vigente e somente o contato real de privacidade', () => {
        renderWithProviders(<Privacy />);

        expect(screen.queryByRole('note', { name: /documento em rascunho/i })).not.toBeInTheDocument();
        expect(screen.getByText(/^versão 1\.0$/i)).toBeInTheDocument();
        expect(screen.getByText(/07\/09\/2026/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'ruanmoraessantosbarbosa@gmail.com' })).toHaveAttribute('href', 'mailto:ruanmoraessantosbarbosa@gmail.com');
        expect(screen.queryByText(/Av\. Paulista/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/dpo@toonlira\.example\.com/i)).not.toBeInTheDocument();
    });

    it('explica processamento remoto, retenção e política de treinamento', () => {
        renderWithProviders(<Privacy />);

        expect(screen.getByText(/Segundo a documentação oficial do Google Cloud/i)).toHaveTextContent(/não usam o conteúdo enviado para treinar/i);
        expect(screen.getByText(/em até uma hora/i)).toBeInTheDocument();
        expect(screen.getByText(/sete dias/i)).toBeInTheDocument();
    });

    it('renders cross-links to other docs', () => {
        renderWithProviders(<Privacy />);
        expect(screen.getByRole('navigation', { name: /outros documentos/i })).toBeInTheDocument();
    });
});
