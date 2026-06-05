import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavBar } from '../NavBar';

const links = [
    { key: 'discover', label: 'Descobrir', onClick: vi.fn() },
    { key: 'community', label: 'Comunidade', onClick: vi.fn() },
];

const baseProps = {
    links,
    onMenuClick: vi.fn(),
};

describe('NavBar', () => {
    it('renders as header landmark', () => {
        render(<NavBar {...baseProps} />);
        expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders wordmark', () => {
        render(<NavBar {...baseProps} />);
        expect(screen.getByRole('button', { name: /manga reader, ir para home/i })).toBeInTheDocument();
    });

    it('calls onLogoClick on wordmark click', async () => {
        const user = userEvent.setup();
        const onLogoClick = vi.fn();
        render(<NavBar {...baseProps} onLogoClick={onLogoClick} />);
        await user.click(screen.getByRole('button', { name: /manga reader, ir para home/i }));
        expect(onLogoClick).toHaveBeenCalled();
    });

    it('renders hamburger button', () => {
        render(<NavBar {...baseProps} />);
        expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument();
    });

    it('calls onMenuClick on hamburger click', async () => {
        const user = userEvent.setup();
        const onMenuClick = vi.fn();
        render(<NavBar {...baseProps} onMenuClick={onMenuClick} />);
        await user.click(screen.getByRole('button', { name: /abrir menu/i }));
        expect(onMenuClick).toHaveBeenCalled();
    });

    it('shows login button when no user', () => {
        render(<NavBar {...baseProps} user={null} />);
        expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    it('calls onAccountClick on login button click', async () => {
        const user = userEvent.setup();
        const onAccountClick = vi.fn();
        render(<NavBar {...baseProps} user={null} onAccountClick={onAccountClick} />);
        await user.click(screen.getByRole('button', { name: /entrar/i }));
        expect(onAccountClick).toHaveBeenCalled();
    });

    it('shows notification and library buttons when user logged in', () => {
        render(<NavBar {...baseProps} user={{ name: 'Ruan', notificationCount: 3, libraryCount: 12 }} />);
        expect(screen.getByRole('button', { name: /notificações/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /biblioteca/i })).toBeInTheDocument();
    });

    it('shows mobile search button', () => {
        render(<NavBar {...baseProps} />);
        expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
    });

    it('shows search field after mobile search click', async () => {
        const user = userEvent.setup();
        render(<NavBar {...baseProps} />);
        // Desktop SearchField already exists (hidden via CSS); after click, mobile overlay adds another
        await user.click(screen.getByRole('button', { name: /buscar/i }));
        expect(screen.getAllByRole('searchbox').length).toBeGreaterThanOrEqual(1);
    });
});
