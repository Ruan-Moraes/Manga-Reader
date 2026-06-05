import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';

import type { Tag } from '@entities/catalog-filter';

import CategoryFilterPanel from '../parts/CategoryFilterPanel';

const TAGS: Tag[] = [
    { value: 1, label: 'Seinen' },
    { value: 2, label: 'Shounen' },
    { value: 3, label: 'Isekai' },
];

const setup = (overrides = {}) =>
    renderWithProviders(
        <CategoryFilterPanel
            tags={TAGS}
            selectedTags={[]}
            onTagToggle={vi.fn()}
            selectedStatus="all"
            onStatusChange={vi.fn()}
            onClearAll={vi.fn()}
            {...overrides}
        />,
    );

describe('CategoryFilterPanel — busca de gêneros', () => {
    it('lista todos os gêneros sem busca', () => {
        setup();
        expect(screen.getByRole('checkbox', { name: 'Seinen' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Shounen' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Isekai' })).toBeInTheDocument();
    });

    it('filtra a lista conforme o termo digitado', async () => {
        const user = userEvent.setup();

        setup();

        await user.type(screen.getByRole('searchbox'), 'sho');

        expect(screen.getByRole('checkbox', { name: 'Shounen' })).toBeInTheDocument();
        expect(screen.queryByRole('checkbox', { name: 'Seinen' })).not.toBeInTheDocument();
        expect(screen.queryByRole('checkbox', { name: 'Isekai' })).not.toBeInTheDocument();
    });

    it('mostra estado vazio quando nenhum gênero casa', async () => {
        const user = userEvent.setup();

        setup();

        await user.type(screen.getByRole('searchbox'), 'zzz');

        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        expect(screen.getByText(/nenhum gênero encontrado/i)).toBeInTheDocument();
    });
});
