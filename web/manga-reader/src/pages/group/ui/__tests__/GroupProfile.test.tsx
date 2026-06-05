import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import GroupProfile from '../GroupProfile';

const setup = () => renderWithProviders(<GroupProfile />);

describe('GroupProfile', () => {
    it('axe', async () => { const { container } = renderWithProviders(<GroupProfile />); expect(await axeComponent(container)).toHaveNoViolations(); });

    it('renders group name heading (defaults to id=1)', () => {
        setup();
        expect(screen.getByRole('heading', { name: /scan brasileiro/i })).toBeInTheDocument();
    });

    it('shows group handle', () => {
        setup();
        expect(screen.getByText('@scan-br')).toBeInTheDocument();
    });

    it('renders group tabs (obras, membros, sobre)', () => {
        setup();
        expect(screen.getByRole('tab', { name: /obras/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /membros/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /sobre/i })).toBeInTheDocument();
    });

    it('switches to members tab', async () => {
        const user = userEvent.setup();
        setup();

        const membersTab = screen.getByRole('tab', { name: /membros/i });
        await user.click(membersTab);

        expect(membersTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('akira_scan')).toBeInTheDocument();
    });

    it('shows follow button', () => {
        setup();
        expect(screen.getByRole('button', { name: /seguir/i })).toBeInTheDocument();
    });
});
