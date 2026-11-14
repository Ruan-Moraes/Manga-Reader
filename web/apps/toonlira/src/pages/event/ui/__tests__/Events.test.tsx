import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';

import Events from '../Events';

describe('Events', () => {
    it('keeps the page container at full available width when a filter is empty', async () => {
        const user = userEvent.setup();
        const { container } = renderWithProviders(<Events />);

        const activeFilter = await screen.findByRole('button', { name: /ativos/i });
        await user.click(activeFilter);

        expect(container.querySelector('.events-page')).toHaveClass('w-full');
    });
});
