import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

import LanguageSwitcher from '../LanguageSwitcher';

i18n.changeLanguage('pt-BR');

function renderSwitcher() {
    return render(
        <I18nextProvider i18n={i18n}>
            <LanguageSwitcher />
        </I18nextProvider>,
    );
}

describe('LanguageSwitcher', () => {
    it('renders all language buttons', () => {
        renderSwitcher();

        expect(screen.getByText(/PT/)).toBeInTheDocument();
        expect(screen.getByText(/EN/)).toBeInTheDocument();
        expect(screen.getByText(/ES/)).toBeInTheDocument();
    });

    it('changes language on click', async () => {
        const user = userEvent.setup();
        renderSwitcher();

        const enButton = screen.getByLabelText('Switch language to EN');
        await user.click(enButton);

        expect(i18n.language).toBe('en-US');

        // Reset for other tests
        await i18n.changeLanguage('pt-BR');
    });

    it('has aria-label on each button', () => {
        renderSwitcher();

        expect(
            screen.getByLabelText('Switch language to PT'),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText('Switch language to EN'),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText('Switch language to ES'),
        ).toBeInTheDocument();
    });
});
