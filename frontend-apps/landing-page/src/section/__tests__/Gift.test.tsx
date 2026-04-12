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

        const tabs = screen.getAllByText(/Presentear/i);

        expect(tabs.length).toBeGreaterThanOrEqual(1);
    });

    it('switches to redeem tab on click', async () => {
        const user = userEvent.setup();
        render(
            <TestProviders>
                <Gift />
            </TestProviders>,
        );

        const redeemTab = screen.getAllByText(/Resgatar/i)[0];
        await user.click(redeemTab);

        expect(screen.getByPlaceholderText(/xxxx/i)).toBeInTheDocument();
    });

    it('renders code input on redeem tab', async () => {
        const user = userEvent.setup();
        render(
            <TestProviders>
                <Gift />
            </TestProviders>,
        );

        const redeemTab = screen.getAllByText(/Resgatar/i)[0];
        await user.click(redeemTab);

        const input = screen.getByPlaceholderText(/xxxx/i);
        expect(input).toHaveAttribute('type', 'text');
    });
});
