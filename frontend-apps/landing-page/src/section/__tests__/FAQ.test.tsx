import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import FAQ from '../FAQ';
import { TestProviders } from '@/test/testUtils';

describe('FAQ', () => {
    it('renders FAQ section title', () => {
        render(
            <TestProviders>
                <FAQ />
            </TestProviders>,
        );

        expect(screen.getByText('Perguntas Frequentes')).toBeInTheDocument();
    });

    it('renders accordion items as buttons', () => {
        render(
            <TestProviders>
                <FAQ />
            </TestProviders>,
        );

        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });
});
