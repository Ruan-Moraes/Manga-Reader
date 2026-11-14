import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PreferenceRail from '../PreferenceRail';
import { TestProviders } from '@/test/testUtils';

describe('PreferenceRail', () => {
    it('stacks theme immediately below language and centers the group', () => {
        render(
            <TestProviders>
                <PreferenceRail />
            </TestProviders>,
        );

        const rail = screen.getByRole('complementary', {
            name: 'Preferências rápidas',
        });
        const buttons = screen.getAllByRole('button');

        expect(rail).toHaveClass('top-1/2', '-translate-y-1/2', 'flex-col');
        expect(buttons[0]).toHaveAccessibleName(
            'Alterar idioma. Atual: Português',
        );
        expect(buttons[1]).toHaveAccessibleName(
            'Alterar tema. Atual: Sistema',
        );
    });
});
