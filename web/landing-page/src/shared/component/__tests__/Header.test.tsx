import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import Header from '../Header';
import { TestProviders } from '@/test/testUtils';

describe('Header', () => {
    it('renders the brand wordmark', () => {
        render(
            <TestProviders>
                <Header />
            </TestProviders>,
        );

        expect(screen.getByText('Reader')).toBeInTheDocument();
    });

    it('renders navigation links', () => {
        render(
            <TestProviders>
                <Header />
            </TestProviders>,
        );

        expect(screen.getAllByText('Benefícios').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Planos').length).toBeGreaterThan(0);
        expect(screen.getAllByText('FAQ').length).toBeGreaterThan(0);
        expect(
            screen.queryByRole('group', { name: 'Idioma' }),
        ).not.toBeInTheDocument();
    });

    it('renders hamburger menu button', () => {
        render(
            <TestProviders>
                <Header />
            </TestProviders>,
        );

        expect(screen.getByLabelText('Abrir menu')).toBeInTheDocument();
    });

    it('opens mobile menu on hamburger click', async () => {
        const user = userEvent.setup();

        render(
            <TestProviders>
                <Header />
            </TestProviders>,
        );

        const button = screen.getByLabelText('Abrir menu');

        await user.click(button);

        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(
            screen.getByRole('dialog', { name: 'Navegação móvel' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('group', { name: 'Idioma' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Selecionar Português' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('group', { name: 'Tema' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Selecionar tema Sistema' }),
        ).toBeInTheDocument();
    });

    it('closes the mobile menu with Escape and restores focus', async () => {
        const user = userEvent.setup();
        render(
            <TestProviders>
                <Header />
            </TestProviders>,
        );
        const button = screen.getByLabelText('Abrir menu');
        await user.click(button);
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(button).toHaveFocus();
    });
});
