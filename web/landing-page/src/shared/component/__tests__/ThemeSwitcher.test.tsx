import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

import ThemeSwitcher from '../ThemeSwitcher';
import {
    initializeThemePreference,
    SETTINGS_STORAGE_KEY,
} from '@/shared/config/theme';

function renderFloating(withOutsideControl = false) {
    return render(
        <I18nextProvider i18n={i18n}>
            <ThemeSwitcher variant="floating" />
            {withOutsideControl ? <button type="button">Fora</button> : null}
        </I18nextProvider>,
    );
}

describe('ThemeSwitcher', () => {
    beforeEach(async () => {
        localStorage.clear();
        initializeThemePreference();
        await i18n.changeLanguage('pt-BR');
    });

    it('renders the system theme as the collapsed default', () => {
        renderFloating();

        const trigger = screen.getByRole('button', {
            name: 'Alterar tema. Atual: Sistema',
        });

        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('opens the menu and exposes all theme choices', async () => {
        const user = userEvent.setup();
        renderFloating();

        await user.click(screen.getByRole('button', { name: /Alterar tema/ }));

        expect(screen.getByRole('menu', { name: 'Tema' })).toBeInTheDocument();
        expect(
            screen.getByRole('menuitemradio', { name: 'Sistema' }),
        ).toHaveAttribute('aria-checked', 'true');
        expect(
            screen.getByRole('menuitemradio', { name: 'Escuro' }),
        ).toHaveAttribute('aria-checked', 'false');
        expect(
            screen.getByRole('menuitemradio', { name: 'Claro' }),
        ).toHaveAttribute('aria-checked', 'false');
    });

    it('selects, persists and applies the light theme', async () => {
        const user = userEvent.setup();
        renderFloating();

        await user.click(screen.getByRole('button', { name: /Alterar tema/ }));
        await user.click(screen.getByRole('menuitemradio', { name: 'Claro' }));

        expect(document.documentElement).toHaveClass('mr-theme-light');
        expect(
            JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')
                .appearance.theme,
        ).toBe('LIGHT');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: 'Alterar tema. Atual: Claro',
            }),
        ).toHaveFocus();
    });

    it('closes on a second trigger click and with Escape', async () => {
        const user = userEvent.setup();
        renderFloating();
        const trigger = screen.getByRole('button', { name: /Alterar tema/ });

        await user.click(trigger);
        await user.click(trigger);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();

        await user.click(trigger);
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it('closes on outside click or when focus leaves', async () => {
        const user = userEvent.setup();
        renderFloating(true);
        const trigger = screen.getByRole('button', { name: /Alterar tema/ });
        const outside = screen.getByRole('button', { name: 'Fora' });

        await user.click(trigger);
        await user.click(outside);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();

        await user.click(trigger);
        fireEvent.blur(screen.getByRole('menuitemradio', { name: 'Sistema' }), {
            relatedTarget: outside,
        });
        outside.focus();
        await waitFor(() =>
            expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
        );
    });

    it('supports arrow navigation through the floating menu', async () => {
        const user = userEvent.setup();
        renderFloating();

        await user.click(screen.getByRole('button', { name: /Alterar tema/ }));
        await user.keyboard('{ArrowDown}');
        expect(
            screen.getByRole('menuitemradio', { name: 'Sistema' }),
        ).toHaveFocus();
        await user.keyboard('{End}');
        expect(
            screen.getByRole('menuitemradio', { name: 'Claro' }),
        ).toHaveFocus();
    });

    it('renders full theme choices in the drawer variant', () => {
        render(
            <I18nextProvider i18n={i18n}>
                <ThemeSwitcher variant="drawer" />
            </I18nextProvider>,
        );

        expect(screen.getByRole('group', { name: 'Tema' })).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Selecionar tema Sistema' }),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(
            screen.getByRole('button', { name: 'Selecionar tema Escuro' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Selecionar tema Claro' }),
        ).toBeInTheDocument();
    });
});
