import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Benefits from '../Benefits';
import { TestProviders } from '@/test/testUtils';

describe('Benefits', () => {
    it('renders benefit cards', () => {
        render(
            <TestProviders>
                <Benefits />
            </TestProviders>,
        );

        expect(screen.getByText(/Biblioteca vasta/i)).toBeInTheDocument();
        expect(screen.getByText(/Atualizações diárias/i)).toBeInTheDocument();
        expect(screen.getByText(/Modo offline/i)).toBeInTheDocument();
        expect(screen.getByText(/Sem anúncios/i)).toBeInTheDocument();
    });

    it('renders section with benefits id', () => {
        const { container } = render(
            <TestProviders>
                <Benefits />
            </TestProviders>,
        );

        expect(container.querySelector('#benefits')).toBeInTheDocument();
    });
});
