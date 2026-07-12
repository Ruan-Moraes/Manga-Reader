import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavBar } from '../NavBar';

const defaultProps = {
    user: null,
    onNavigate: vi.fn(),
    onOpenSideMenu: vi.fn(),
};

describe('layout/NavBar', () => {
    it('renders banner landmark', () => {
        render(<NavBar {...defaultProps} />);
        expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders logo wordmark', () => {
        render(<NavBar {...defaultProps} />);
        expect(screen.getAllByRole('button', { name: /manga reader, ir para home/i }).length).toBeGreaterThan(0);
    });

    it('keeps the mobile header free of the site logo', () => {
        render(<NavBar {...defaultProps} />);
        const mobileHeader = screen.getByTestId('mobile-header');
        expect(within(mobileHeader).queryByRole('button', { name: /manga reader, ir para home/i })).not.toBeInTheDocument();
        expect(within(mobileHeader).getByRole('searchbox', { name: /buscar/i })).toBeInTheDocument();
    });

    it('renders hamburger button(s) for mobile + tablet', () => {
        render(<NavBar {...defaultProps} />);
        expect(screen.getAllByRole('button', { name: /abrir menu/i }).length).toBeGreaterThan(0);
    });

    it('calls onOpenSideMenu when hamburger clicked', async () => {
        const onOpenSideMenu = vi.fn();
        const user = userEvent.setup();
        render(<NavBar {...defaultProps} onOpenSideMenu={onOpenSideMenu} />);
        await user.click(screen.getAllByRole('button', { name: /abrir menu/i })[0]);
        expect(onOpenSideMenu).toHaveBeenCalledOnce();
    });

    it('calls onNavigate("/") when logo clicked', async () => {
        const onNavigate = vi.fn();
        const user = userEvent.setup();
        render(<NavBar {...defaultProps} onNavigate={onNavigate} />);
        await user.click(screen.getAllByRole('button', { name: /manga reader, ir para home/i })[0]);
        expect(onNavigate).toHaveBeenCalledWith('/');
    });

    it('renders Entrar button when no user', () => {
        render(<NavBar {...defaultProps} user={null} />);
        expect(screen.getAllByRole('button', { name: /entrar/i }).length).toBeGreaterThan(0);
    });

    it('renders mega-menu section buttons when user absent (desktop nav)', () => {
        render(<NavBar {...defaultProps} />);
        expect(screen.getAllByRole('button', { name: /descobrir/i }).length).toBeGreaterThan(0);
    });

    it('renders user avatar button when user provided', () => {
        render(<NavBar {...defaultProps} user={{ name: 'Ana Silva', libraryCount: 3 }} />);
        expect(screen.getAllByRole('button', { name: /conta de ana silva/i }).length).toBeGreaterThan(0);
    });

    it('renders Notificações button when user provided', () => {
        render(<NavBar {...defaultProps} user={{ name: 'Ana Silva' }} />);
        expect(screen.getAllByRole('button', { name: /notificações/i }).length).toBeGreaterThan(0);
    });

    it('renders Biblioteca button when user provided', () => {
        render(<NavBar {...defaultProps} user={{ name: 'Ana Silva' }} />);
        expect(screen.getAllByRole('button', { name: /biblioteca/i }).length).toBeGreaterThan(0);
    });

    it('renders persistent search input (no toggle)', () => {
        render(<NavBar {...defaultProps} />);
        expect(screen.getAllByRole('searchbox', { name: /buscar/i }).length).toBeGreaterThan(0);
    });

    it('opens mega-menu on Descobrir click', () => {
        render(<NavBar {...defaultProps} />);
        const btn = screen.getAllByRole('button', { name: /descobrir/i })[0];
        fireEvent.click(btn);
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('shows Lançamentos item inside Descobrir menu', () => {
        render(<NavBar {...defaultProps} />);
        const btn = screen.getAllByRole('button', { name: /descobrir/i })[0];
        fireEvent.click(btn);
        expect(screen.getByRole('menuitem', { name: /lançamentos/i })).toBeInTheDocument();
    });

    it('calls onNavigate with path when menu item clicked', () => {
        const onNavigate = vi.fn();
        render(<NavBar {...defaultProps} onNavigate={onNavigate} />);
        const btn = screen.getAllByRole('button', { name: /descobrir/i })[0];
        fireEvent.click(btn);
        fireEvent.click(screen.getByRole('menuitem', { name: /em alta/i }));
        expect(onNavigate).toHaveBeenCalledWith('/trending');
    });
});
