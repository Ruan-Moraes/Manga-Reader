import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from '@/App';
import { TestProviders } from '@/test/testUtils';

describe('App', () => {
    it('renders the full landing page without crashing', async () => {
        const { container } = render(
            <TestProviders>
                <App />
            </TestProviders>,
        );

        // final CTA + footer estão presentes
        expect(
            await screen.findByText('Comece sua biblioteca hoje.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Voltar ao topo')).toBeInTheDocument();
        expect(container.querySelector('#final')).toBeInTheDocument();
        expect(container.querySelector('#translation')).toBeInTheDocument();
        expect(container.querySelector('footer')).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Pular para o conteúdo' }),
        ).toHaveAttribute('href', '#main-content');
        expect(
            screen.getByRole('button', {
                name: 'Alterar idioma. Atual: Português',
            }),
        ).toHaveAttribute('aria-expanded', 'false');
    });
});
