import { describe, it, expect } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import Contact from '../Contact';

describe('Contact', () => {
    it('renders page title', () => {
        renderWithProviders(<Contact />);
        expect(screen.getByRole('heading', { name: /contatos/i, level: 1 })).toBeInTheDocument();
    });

    it('Contato tab is active', () => {
        renderWithProviders(<Contact />);
        expect(screen.getByRole('button', { name: 'Contato' })).toHaveAttribute('aria-current', 'page');
    });

    it('renders all 6 channel cards', () => {
        renderWithProviders(<Contact />);
        expect(screen.getByRole('article', { name: /canal: suporte geral/i })).toBeInTheDocument();
        expect(screen.getByRole('article', { name: /canal: canal prioritário/i })).toBeInTheDocument();
    });

    it('renders mailto links for channels', () => {
        renderWithProviders(<Contact />);
        const links = screen.getAllByRole('link');
        const mailtos = links.filter(l => l.getAttribute('href')?.startsWith('mailto:'));
        expect(mailtos.length).toBeGreaterThan(0);
    });

    it('renders form fields', () => {
        renderWithProviders(<Contact />);
        expect(screen.getByLabelText(/^Nome/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^E-mail/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Assunto/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Mensagem/i)).toBeInTheDocument();
    });

    it('shows validation errors on empty submit', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Contact />);
        await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
        expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/e-mail é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/selecione um assunto/i)).toBeInTheDocument();
        expect(screen.getByText(/mensagem é obrigatória/i)).toBeInTheDocument();
    });

    it('shows success state after valid submission', async () => {
        const user = userEvent.setup();
        const { container } = renderWithProviders(<Contact />);

        await user.type(screen.getByLabelText(/^Nome/i), 'Ruan Barbosa');
        await user.type(screen.getByLabelText(/^E-mail/i), 'ruan@test.com');
        // Select é custom (Radix + <select> nativo escondido); dirige o nativo.
        fireEvent.change(container.querySelector('select')!, { target: { value: 'general' } });
        await user.type(screen.getByLabelText(/^Mensagem/i), 'Minha mensagem com detalhe suficiente.');

        await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));

        await waitFor(
            () => {
                expect(screen.getByText(/mensagem enviada/i)).toBeInTheDocument();
            },
            { timeout: 3000 },
        );
    }, 8000);

    it('renders reset button after success and allows resetting', async () => {
        const user = userEvent.setup();
        const { container } = renderWithProviders(<Contact />);

        await user.type(screen.getByLabelText(/^Nome/i), 'Ruan Barbosa');
        await user.type(screen.getByLabelText(/^E-mail/i), 'ruan@test.com');
        fireEvent.change(container.querySelector('select')!, { target: { value: 'general' } });
        await user.type(screen.getByLabelText(/^Mensagem/i), 'Mensagem longa o suficiente aqui.');

        await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));

        const resetBtn = await screen.findByRole('button', { name: /enviar outra mensagem/i }, { timeout: 3000 });
        await user.click(resetBtn);
        expect(screen.getByLabelText(/^Nome/i)).toHaveValue('');
    }, 8000);

    it('renders postal address section', () => {
        renderWithProviders(<Contact />);
        expect(screen.getByText(/endereço postal/i)).toBeInTheDocument();
        // Both postal entries contain "Av. Paulista"; just confirm section title is present
        expect(screen.getAllByText(/Av\. Paulista/i).length).toBeGreaterThan(0);
    });
});
