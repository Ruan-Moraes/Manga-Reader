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
            screen.getByText('O que nossos leitores dizem'),
        ).toBeInTheDocument();
    });

    it('renders testimonial authors', () => {
        render(
            <TestProviders>
                <Testimonials />
            </TestProviders>,
        );

        expect(screen.getByText('Ana Lima')).toBeInTheDocument();
        expect(screen.getByText('Carlos Matos')).toBeInTheDocument();
    });
});
