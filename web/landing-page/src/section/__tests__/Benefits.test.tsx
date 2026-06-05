import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Benefits from '../Benefits';
import { TestProviders } from '@/test/testUtils';

describe('Benefits', () => {
    it('renders all 4 benefit cards', () => {
        render(
            <TestProviders>
                <Benefits />
            </TestProviders>,
        );

        expect(screen.getByText(/Biblioteca Vasta/i)).toBeInTheDocument();
        expect(screen.getByText(/Atualizações Diárias/i)).toBeInTheDocument();
        expect(screen.getByText(/Multi-plataforma/i)).toBeInTheDocument();
        expect(screen.getByText(/Leitura Offline/i)).toBeInTheDocument();
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
