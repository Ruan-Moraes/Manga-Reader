import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Testimonials from '../Testimonials';
import { TestProviders } from '@/test/testUtils';

describe('Testimonials', () => {
    it('renders testimonials section title', () => {
        render(
            <TestProviders>
                <Testimonials />
            </TestProviders>,
        );

        expect(
            screen.getByText('O que dizem nossos leitores'),
        ).toBeInTheDocument();
    });

    it('renders blockquote elements', () => {
        const { container } = render(
            <TestProviders>
                <Testimonials />
            </TestProviders>,
        );

        const quotes = container.querySelectorAll('blockquote');
        expect(quotes.length).toBeGreaterThan(0);
    });
});
