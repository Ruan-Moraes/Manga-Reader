import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import Header from '../Header';
import { TestProviders } from '@/test/testUtils';

describe('Header', () => {
    it('renders logo text', () => {
        render(
            <TestProviders>
                <Header />
            </TestProviders>,
        );

        expect(screen.getByText('Manga Reader')).toBeInTheDocument();
    });

    it('renders navigation links (desktop)', () => {
        render(
            <TestProviders>
                <Header />
            </TestProviders>,
        );

        expect(screen.getAllByText('Benefícios').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Planos').length).toBeGreaterThan(0);
        expect(screen.getAllByText('FAQ').length).toBeGreaterThan(0);
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
    });
});
