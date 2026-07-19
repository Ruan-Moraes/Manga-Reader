import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_USER_SETTINGS, applySystemPreferences, readStoredUserSettings } from '@entities/user';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';

import ThemePreferenceMenu from '../ThemePreferenceMenu';

describe('ThemePreferenceMenu', () => {
    afterEach(() => {
        applySystemPreferences(DEFAULT_USER_SETTINGS);
    });

    it('abre as opções Sistema, Claro e Escuro', async () => {
        const user = userEvent.setup();

        renderWithProviders(<ThemePreferenceMenu />);
        await user.click(screen.getByRole('button', { name: /alterar tema/i }));

        expect(await screen.findByRole('menuitem', { name: /sistema/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /claro/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /escuro/i })).toBeInTheDocument();
    });

    it('aplica e persiste o tema selecionado sem navegar', async () => {
        const user = userEvent.setup();

        renderWithProviders(<ThemePreferenceMenu />);
        await user.click(screen.getByRole('button', { name: /alterar tema/i }));
        await user.click(await screen.findByRole('menuitem', { name: /claro/i }));

        await waitFor(() => {
            expect(document.documentElement).toHaveClass('mr-theme-light');
            expect(readStoredUserSettings().appearance.theme).toBe('LIGHT');
        });
        expect(window.location.pathname).not.toBe('/settings');
        expect(screen.getByRole('button', { name: /alterar tema/i })).toHaveTextContent('Claro');
    });
});
