import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { axeComponent } from '@/test/helpers/axe';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';

import CatalogResultCard from '../CatalogResultCard';

const result = {
    id: '1',
    slug: 'takehiko-inoue',
    entityType: 'AUTHOR' as const,
    name: 'Takehiko Inoue',
    image: null,
    matchedBy: 'PEN_NAME' as const,
    matchedText: 'Inoue',
    roles: ['AUTHOR', 'ARTIST'],
    workCount: 8,
    country: 'Japan',
};

describe('CatalogResultCard', () => {
    it('apresenta categoria, papéis e motivo da correspondência', async () => {
        const onOpen = vi.fn();
        const { container } = renderWithProviders(<CatalogResultCard result={result} onOpen={onOpen} />);

        expect(screen.getByText('Takehiko Inoue')).toBeInTheDocument();
        expect(screen.getByText(/autor · artista/i)).toBeInTheDocument();
        expect(screen.getByText(/pseudônimo: inoue/i)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /takehiko inoue/i }));

        expect(onOpen).toHaveBeenCalledOnce();
        expect(await axeComponent(container)).toHaveNoViolations();
    });
});
