import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AdminPortalShortcut from '../AdminPortalShortcut';

describe('AdminPortalShortcut', () => {
    it('renders nothing when the user cannot access the admin portal', () => {
        render(<AdminPortalShortcut visible={false} onNavigate={vi.fn()} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('navigates to the dashboard when clicked', async () => {
        const onNavigate = vi.fn();
        const user = userEvent.setup();
        render(<AdminPortalShortcut visible onNavigate={onNavigate} />);

        await user.click(screen.getByRole('button', { name: /dashboard/i }));

        expect(onNavigate).toHaveBeenCalledWith('/dashboard');
    });
});
