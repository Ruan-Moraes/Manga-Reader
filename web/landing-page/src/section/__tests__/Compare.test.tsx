import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Compare from '../Compare';
import { TestProviders } from '@/test/testUtils';

describe('Compare', () => {
    it('renders the comparison title and columns', () => {
        render(
            <TestProviders>
                <Compare />
            </TestProviders>,
        );

        expect(screen.getByText('Por que vale a pena assinar')).toBeInTheDocument();
        expect(screen.getByText('Grátis')).toBeInTheDocument();
        expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('renders feature rows', () => {
        render(
            <TestProviders>
                <Compare />
            </TestProviders>,
        );

        expect(screen.getByText('Leitura offline')).toBeInTheDocument();
        expect(screen.getByText('Download de capítulos')).toBeInTheDocument();
    });
});
