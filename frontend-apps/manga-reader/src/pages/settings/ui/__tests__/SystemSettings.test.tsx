import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import SystemSettings from '../SystemSettings';

describe('SystemSettings', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<SystemSettings />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders main landmark', () => {
        renderWithProviders(<SystemSettings />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders page heading', () => {
        renderWithProviders(<SystemSettings />);
        expect(screen.getByRole('heading', { name: /configurações/i })).toBeInTheDocument();
    });

    it('renders all 6 tabs', () => {
        renderWithProviders(<SystemSettings />);
        expect(screen.getByRole('tab', { name: /leitor/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /aparência/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /idioma e região/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /acessibilidade/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /dados/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /sobre/i })).toBeInTheDocument();
    });

    it('Leitor tab is active by default', () => {
        renderWithProviders(<SystemSettings />);
        expect(screen.getByRole('tab', { name: /leitor/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('renders reader direction control on Leitor tab', () => {
        renderWithProviders(<SystemSettings />);
        expect(screen.getByRole('radio', { name: 'LTR' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'RTL' })).toBeInTheDocument();
    });

    it('switches to Aparência tab and shows theme radio', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SystemSettings />);
        await user.click(screen.getByRole('tab', { name: /aparência/i }));
        expect(screen.getByRole('radio', { name: /escuro/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /seguir sistema/i })).toBeInTheDocument();
    });

    it('switches to Idioma tab and shows language select', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SystemSettings />);
        await user.click(screen.getByRole('tab', { name: /idioma e região/i }));
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByLabelText(/português \(pt-br\)/i)).toBeInTheDocument();
    });

    it('switches to Acessibilidade tab and shows switches', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SystemSettings />);
        await user.click(screen.getByRole('tab', { name: /acessibilidade/i }));
        expect(screen.getByRole('switch', { name: /reduzir movimento/i })).toBeInTheDocument();
    });

    it('switches to Dados tab and shows export/import buttons', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SystemSettings />);
        await user.click(screen.getByRole('tab', { name: /dados/i }));
        expect(screen.getByRole('button', { name: /exportar minha biblioteca/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /importar lista/i })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /limpar/i }).length).toBeGreaterThan(0);
    });

    it('switches to Sobre tab and shows version info and shortcuts table', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SystemSettings />);
        await user.click(screen.getByRole('tab', { name: /sobre/i }));
        expect(screen.getByText('3.0.0')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /tecla/i })).toBeInTheDocument();
    });

    it('auto-mark switch toggles on Leitor tab', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SystemSettings />);
        const sw = screen.getByRole('switch', { name: /marcar como lido/i });
        expect(sw).toHaveAttribute('aria-checked', 'true');
        await user.click(sw);
        expect(sw).toHaveAttribute('aria-checked', 'false');
    });
});
