import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Stats from '../Stats';
import { TestProviders } from '@/test/testUtils';

describe('Stats', () => {
    it('renders the section title', () => {
        render(
            <TestProviders>
                <Stats />
            </TestProviders>,
        );

        expect(
            screen.getByText('Números que falam por si'),
        ).toBeInTheDocument();
    });

    it('renders stat labels after loading', async () => {
        render(
            <TestProviders>
                <Stats />
            </TestProviders>,
        );

        expect(
            await screen.findByText('Capítulos por semana'),
        ).toBeInTheDocument();
    });
});
