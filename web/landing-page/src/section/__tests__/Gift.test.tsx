import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import Gift from '../Gift';
import { TestProviders } from '@/test/testUtils';

describe('Gift', () => {
    it('renders give tab by default', () => {
        render(
            <TestProviders>
                <Gift />
            </TestProviders>,
        );

        expect(screen.getByText(/Dar presente/i)).toBeInTheDocument();
    });

    it('switches to redeem tab on click', async () => {
        const user = userEvent.setup();

        render(
            <TestProviders>
                <Gift />
            </TestProviders>,
        );

        await user.click(screen.getByText(/Resgatar código/i));

        expect(screen.getByPlaceholderText(/MR-/i)).toBeInTheDocument();
    });

    it('renders code input on redeem tab', async () => {
        const user = userEvent.setup();

        render(
            <TestProviders>
                <Gift />
            </TestProviders>,
        );

        await user.click(screen.getByText(/Resgatar código/i));

        const input = screen.getByPlaceholderText(/MR-/i);

        expect(input).toHaveAttribute('type', 'text');
    });
});
