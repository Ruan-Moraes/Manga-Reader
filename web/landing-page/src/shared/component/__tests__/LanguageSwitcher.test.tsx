import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

import LanguageSwitcher from '../LanguageSwitcher';

function renderFloating(withOutsideControl = false) {
    return render(
        <I18nextProvider i18n={i18n}>
            <LanguageSwitcher variant="floating" />
            {withOutsideControl ? <button type="button">Fora</button> : null}
        </I18nextProvider>,
    );
}

describe('LanguageSwitcher', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('pt-BR');
    });

    it('renders a collapsed floating trigger with the current flag and code', () => {
        const { container } = renderFloating();

        const trigger = screen.getByRole('button', {
            name: 'Alterar idioma. Atual: Português',
        });

        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveTextContent('🇧🇷');
        expect(trigger).toHaveTextContent('PT');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(container.firstChild).toHaveClass('relative', 'block');
    });

    it('opens to full language names and marks the selected menu item', async () => {
        const user = userEvent.setup();
        renderFloating();

        await user.click(
            screen.getByRole('button', { name: /Alterar idioma/ }),
        );

        expect(
            screen.getByRole('menu', { name: 'Idioma' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('menuitemradio', { name: 'Português' }),
        ).toHaveAttribute('aria-checked', 'true');
        expect(
            screen.getByRole('menuitemradio', { name: 'English' }),
        ).toHaveAttribute('aria-checked', 'false');
        expect(screen.getByText('🇲🇽')).toHaveAttribute('aria-hidden', 'true');
    });

    it('closes the floating menu when the trigger is clicked again', async () => {
        const user = userEvent.setup();
        renderFloating();
        const trigger = screen.getByRole('button', { name: /Alterar idioma/ });

        await user.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        await user.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('changes language, closes the menu and updates the trigger', async () => {
        const user = userEvent.setup();
        renderFloating();

        await user.click(
            screen.getByRole('button', { name: /Alterar idioma/ }),
        );
        await user.click(
            screen.getByRole('menuitemradio', { name: 'English' }),
        );

        expect(i18n.language).toBe('en-US');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: 'Change language. Current: English',
            }),
        ).toHaveTextContent('EN');
    });

    it('closes with Escape and restores focus to the trigger', async () => {
        const user = userEvent.setup();
        renderFloating();
        const trigger = screen.getByRole('button', { name: /Alterar idioma/ });

        await user.click(trigger);
        await user.keyboard('{Escape}');

        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it('closes when clicking outside or moving focus outside', async () => {
        const user = userEvent.setup();
        renderFloating(true);
        const trigger = screen.getByRole('button', { name: /Alterar idioma/ });
        const outside = screen.getByRole('button', { name: 'Fora' });

        await user.click(trigger);
        await user.click(outside);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();

        await user.click(trigger);
        fireEvent.blur(
            screen.getByRole('menuitemradio', { name: 'Português' }),
            {
                relatedTarget: outside,
            },
        );
        outside.focus();
        await waitFor(() =>
            expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
        );
    });

    it('keeps the option click active when Safari blurs with no related target', async () => {
        const user = userEvent.setup();
        renderFloating();

        await user.click(
            screen.getByRole('button', { name: /Alterar idioma/ }),
        );
        const portuguese = screen.getByRole('menuitemradio', {
            name: 'Português',
        });
        const english = screen.getByRole('menuitemradio', { name: 'English' });

        fireEvent.pointerDown(english);
        fireEvent.blur(portuguese, { relatedTarget: null });
        fireEvent.click(english);

        await waitFor(() => expect(i18n.language).toBe('en-US'));
        expect(
            screen.getByRole('button', {
                name: 'Change language. Current: English',
            }),
        ).toHaveTextContent('EN');
    });

    it('renders full language options in the drawer variant', () => {
        const { container } = render(
            <I18nextProvider i18n={i18n}>
                <LanguageSwitcher variant="drawer" />
            </I18nextProvider>,
        );

        expect(
            screen.getByRole('group', { name: 'Idioma' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Selecionar Português' }),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('Español')).toBeInTheDocument();
        expect(container.querySelector('[role="group"]')).toHaveClass(
            'grid-cols-1',
            'min-[360px]:grid-cols-2',
        );
    });
});
