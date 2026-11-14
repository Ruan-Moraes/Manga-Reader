import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SideMenu } from '../SideMenu';

const defaultProps = {
    open: true,
    onClose: vi.fn(),
    user: { name: 'Leitor BR' },
    isLoggedIn: true,
    canAccessAdminPortal: false,
    onNavigate: vi.fn(),
};

describe('layout/SideMenu', () => {
    it('renders nothing when closed', () => {
        render(<SideMenu {...defaultProps} open={false} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog when open', () => {
        render(<SideMenu {...defaultProps} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows user name', () => {
        render(<SideMenu {...defaultProps} />);
        expect(screen.getByText('Leitor BR')).toBeInTheDocument();
    });

    it('shows Feed section items', () => {
        render(<SideMenu {...defaultProps} />);
        expect(screen.getByRole('button', { name: /início/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /em alta/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /novidades/i })).toBeInTheDocument();
    });

    it('shows Biblioteca section when logged in', () => {
        render(<SideMenu {...defaultProps} isLoggedIn={true} />);
        expect(screen.getByRole('button', { name: /meus mangás/i })).toBeInTheDocument();
    });

    it('hides Biblioteca section when not logged in', () => {
        render(<SideMenu {...defaultProps} isLoggedIn={false} user={null} />);
        expect(screen.queryByRole('button', { name: /meus mangás/i })).not.toBeInTheDocument();
    });

    it('shows Comunidade items', () => {
        render(<SideMenu {...defaultProps} />);
        expect(screen.getByRole('button', { name: /notícias/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /eventos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /grupos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /fórum/i })).toBeInTheDocument();
    });

    it('shows Configurações footer button when logged in', () => {
        render(<SideMenu {...defaultProps} isLoggedIn={true} />);
        expect(screen.getByRole('button', { name: /configurações/i })).toBeInTheDocument();
    });

    it('shows Sair button when logged in', () => {
        render(<SideMenu {...defaultProps} isLoggedIn={true} />);
        expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
    });

    it('shows the dashboard item for users who can access the admin portal', () => {
        render(<SideMenu {...defaultProps} canAccessAdminPortal />);
        expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('does not show the dashboard item without admin portal access', () => {
        render(<SideMenu {...defaultProps} canAccessAdminPortal={false} />);
        expect(screen.queryByRole('button', { name: /dashboard/i })).not.toBeInTheDocument();
    });

    it('navigates to the dashboard and closes the menu', async () => {
        const onNavigate = vi.fn();
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<SideMenu {...defaultProps} canAccessAdminPortal onNavigate={onNavigate} onClose={onClose} />);

        await user.click(screen.getByRole('button', { name: /dashboard/i }));

        expect(onNavigate).toHaveBeenCalledWith('/dashboard');
        expect(onClose).toHaveBeenCalled();
    });

    it('shows Entrar and Cadastrar when not logged in', () => {
        render(<SideMenu {...defaultProps} isLoggedIn={false} user={null} />);
        expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument();
    });

    it('calls onNavigate and onClose when nav item clicked', async () => {
        const onNavigate = vi.fn();
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<SideMenu {...defaultProps} onNavigate={onNavigate} onClose={onClose} />);
        await user.click(screen.getByRole('button', { name: /notícias/i }));
        expect(onNavigate).toHaveBeenCalledWith('/news');
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onLogoutClick when Sair clicked', async () => {
        const onLogoutClick = vi.fn();
        const user = userEvent.setup();
        render(<SideMenu {...defaultProps} onLogoutClick={onLogoutClick} />);
        await user.click(screen.getByRole('button', { name: /sair/i }));
        expect(onLogoutClick).toHaveBeenCalledOnce();
    });
});
