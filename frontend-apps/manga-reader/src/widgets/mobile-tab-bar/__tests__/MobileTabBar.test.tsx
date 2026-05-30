import { describe, it, expect, vi } from 'vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MobileTabBar } from '../MobileTabBar';

describe('layout/MobileTabBar', () => {
    it('renders navigation landmark', () => {
        render(<MobileTabBar activeKey="home" onNavigate={vi.fn()} />);

        expect(screen.getByRole('navigation', { name: /navegação inferior/i })).toBeInTheDocument();
    });

    it('renders all 4 tab buttons', () => {
        render(<MobileTabBar activeKey="home" onNavigate={vi.fn()} />);

        expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /biblioteca/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /perfil/i })).toBeInTheDocument();
    });

    it('marks active tab with aria-current=page', () => {
        render(<MobileTabBar activeKey="search" onNavigate={vi.fn()} />);

        expect(screen.getByRole('button', { name: /buscar/i })).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark inactive tabs with aria-current', () => {
        render(<MobileTabBar activeKey="home" onNavigate={vi.fn()} />);

        expect(screen.getByRole('button', { name: /buscar/i })).not.toHaveAttribute('aria-current');
    });

    it('calls onNavigate("/") when Home tab clicked', async () => {
        const onNavigate = vi.fn();

        const user = userEvent.setup();

        render(<MobileTabBar activeKey="search" onNavigate={onNavigate} />);

        await user.click(screen.getByRole('button', { name: /^home$/i }));

        expect(onNavigate).toHaveBeenCalledWith('/');
    });

    it('calls onNavigate("/library") when Biblioteca tab clicked', async () => {
        const onNavigate = vi.fn();

        const user = userEvent.setup();

        render(<MobileTabBar activeKey="home" onNavigate={onNavigate} />);

        await user.click(screen.getByRole('button', { name: /biblioteca/i }));

        expect(onNavigate).toHaveBeenCalledWith('/library');
    });

    it('calls onNavigate("/profile") when Perfil tab clicked', async () => {
        const onNavigate = vi.fn();

        const user = userEvent.setup();

        render(<MobileTabBar activeKey="home" onNavigate={onNavigate} />);

        await user.click(screen.getByRole('button', { name: /perfil/i }));

        expect(onNavigate).toHaveBeenCalledWith('/profile');
    });
});
