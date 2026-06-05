import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { ToastProvider } from '@ui/Toast';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import SystemSettings from '../SystemSettings';

const renderPage = (ui: ReactElement = <SystemSettings />) => renderWithProviders(<ToastProvider>{ui}</ToastProvider>);

describe('SystemSettings', () => {
    it('has no axe violations', async () => {
        const { container } = renderPage();
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders main landmark', () => {
        renderPage();
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders page heading', () => {
        renderPage();
        expect(screen.getByRole('heading', { name: /configurações/i })).toBeInTheDocument();
    });

    it('shows the logged-out meta (saved on this device only)', () => {
        renderPage();
        expect(screen.getByText(/salvo só neste dispositivo/i)).toBeInTheDocument();
    });

    it('renders all 6 tabs', () => {
        renderPage();
        expect(screen.getByRole('tab', { name: /leitor/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /aparência/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /idioma e região/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /acessibilidade/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /dados/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /sobre/i })).toBeInTheDocument();
    });

    it('Leitor tab is active by default', () => {
        renderPage();
        expect(screen.getByRole('tab', { name: /leitor/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('reading direction defaults to right-to-left', () => {
        renderPage();
        expect(screen.getByRole('radio', { name: /dir\. → esq\./i })).toHaveAttribute('aria-checked', 'true');
    });

    it('switches to Aparência tab and shows theme cards with EM BREVE on light', async () => {
        const user = userEvent.setup();
        renderPage();
        await user.click(screen.getByRole('tab', { name: /aparência/i }));
        expect(screen.getByRole('radio', { name: /escuro/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /sistema/i })).toBeInTheDocument();
        expect(screen.getByText(/em breve/i)).toBeInTheDocument();
    });

    it('switches to Idioma tab and shows interface language select', async () => {
        const user = userEvent.setup();
        renderPage();
        await user.click(screen.getByRole('tab', { name: /idioma e região/i }));
        expect(screen.getByRole('combobox', { name: /idioma da interface/i })).toBeInTheDocument();
    });

    it('switches to Acessibilidade tab and shows reduce-motion switch', async () => {
        const user = userEvent.setup();
        renderPage();
        await user.click(screen.getByRole('tab', { name: /acessibilidade/i }));
        expect(screen.getByRole('switch', { name: /reduzir movimento/i })).toBeInTheDocument();
    });

    it('switches to Dados tab and shows clear/export/import actions', async () => {
        const user = userEvent.setup();
        renderPage();
        await user.click(screen.getByRole('tab', { name: /dados/i }));
        expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /importar/i })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /limpar/i }).length).toBeGreaterThan(0);
    });

    it('switches to Sobre tab and shows version and shortcuts table', async () => {
        const user = userEvent.setup();
        renderPage();
        await user.click(screen.getByRole('tab', { name: /sobre/i }));
        expect(screen.getByText(/v0\.9\.4/)).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /teclas/i })).toBeInTheDocument();
    });

    it('auto-mark switch toggles on Leitor tab', async () => {
        const user = userEvent.setup();
        renderPage();
        const sw = screen.getByRole('switch', { name: /marcar como lido/i });
        expect(sw).toHaveAttribute('aria-checked', 'true');
        await user.click(sw);
        expect(sw).toHaveAttribute('aria-checked', 'false');
    });
});
