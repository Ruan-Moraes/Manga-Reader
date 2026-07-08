import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';

import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { FloatingPortalContext } from '@ui/FloatingPortalContext';

import EntitySearchSelect from '../EntitySearchSelect';

type Item = { id: string; name: string };

const ITEMS: Item[] = [
    { id: '1', name: 'Aki Irie' },
    { id: '2', name: 'Naoki Urasawa' },
];

const renderSelect = (overrides: Partial<Parameters<typeof EntitySearchSelect<Item>>[0]> = {}, container?: HTMLElement) => {
    const onPick = vi.fn();
    const fetcher = vi.fn(async () => ITEMS);
    render(
        <QueryClientProvider client={createTestQueryClient()}>
            <FloatingPortalContext.Provider value={container ?? null}>
                <EntitySearchSelect<Item>
                    queryKey="test-entity-search"
                    fetcher={fetcher}
                    getKey={i => i.id}
                    getLabel={i => i.name}
                    onPick={onPick}
                    placeholder="Buscar autor..."
                    emptyLabel="Nenhum resultado"
                    {...overrides}
                />
            </FloatingPortalContext.Provider>
        </QueryClientProvider>,
    );
    return { onPick, fetcher };
};

const typeAndWait = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByRole('combobox'), 'aki');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument(), { timeout: 2000 });
    await screen.findByRole('option', { name: /aki irie/i }, { timeout: 2000 });
};

describe('EntitySearchSelect', () => {
    it('abre a lista ao digitar e resultado é clicável', async () => {
        const user = userEvent.setup();
        const { onPick } = renderSelect();

        await typeAndWait(user);
        await user.click(screen.getByRole('option', { name: /naoki urasawa/i }).querySelector('button')!);

        expect(onPick).toHaveBeenCalledWith(ITEMS[1]);
        // Limpa o termo e fecha a lista após escolher.
        expect(screen.getByRole('combobox')).toHaveValue('');
    });

    it('navega com ArrowDown/ArrowUp e seleciona com Enter', async () => {
        const user = userEvent.setup();
        const { onPick } = renderSelect();

        await typeAndWait(user);
        await user.keyboard('{ArrowDown}{ArrowDown}');
        expect(screen.getByRole('option', { name: /naoki urasawa/i })).toHaveAttribute('aria-selected', 'true');

        await user.keyboard('{Enter}');
        expect(onPick).toHaveBeenCalledWith(ITEMS[1]);
    });

    it('Escape fecha só a lista, sem propagar para o dialog', async () => {
        const user = userEvent.setup();
        renderSelect();

        await typeAndWait(user);
        await user.keyboard('{Escape}');

        await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    });

    it('exibe emptyLabel quando não há resultados', async () => {
        const user = userEvent.setup();
        renderSelect({ fetcher: vi.fn(async () => []) });

        await user.type(screen.getByRole('combobox'), 'zzz');
        await screen.findByText('Nenhum resultado', {}, { timeout: 2000 });
    });

    it('portala a lista para o container do FloatingPortalContext', async () => {
        const user = userEvent.setup();
        const host = document.createElement('div');
        host.id = 'portal-host';
        document.body.appendChild(host);

        renderSelect({}, host);
        await typeAndWait(user);

        expect(host.contains(screen.getByRole('listbox'))).toBe(true);
        host.remove();
    });
});
