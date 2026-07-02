import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import Demo from '../Demo';
import { TestProviders } from '@/test/testUtils';

describe('Demo', () => {
    it('renders section title and tablist', () => {
        render(
            <TestProviders>
                <Demo />
            </TestProviders>,
        );

        expect(
            screen.getByText('A plataforma inteira, na palma da mão'),
        ).toBeInTheDocument();
        expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('marks the library tab as selected by default', () => {
        render(
            <TestProviders>
                <Demo />
            </TestProviders>,
        );

        expect(screen.getByRole('tab', { name: /Biblioteca/ })).toHaveAttribute(
            'aria-selected',
            'true',
        );
    });

    it('selects another tab on click', async () => {
        const user = userEvent.setup();

        render(
            <TestProviders>
                <Demo />
            </TestProviders>,
        );

        const readerTab = screen.getByRole('tab', { name: /Leitor/ });

        await user.click(readerTab);

        expect(readerTab).toHaveAttribute('aria-selected', 'true');
    });
});
