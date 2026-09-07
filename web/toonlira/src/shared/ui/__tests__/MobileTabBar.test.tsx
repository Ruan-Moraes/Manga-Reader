import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home, Search, BookOpen, User } from 'lucide-react';
import { MobileTabBar } from '../MobileTabBar';
import type { TabBarItem } from '../MobileTabBar';

const items: TabBarItem[] = [
    { key: 'home', label: 'Início', icon: Home, onClick: vi.fn() },
    { key: 'search', label: 'Buscar', icon: Search, onClick: vi.fn() },
    { key: 'library', label: 'Biblioteca', icon: BookOpen, onClick: vi.fn() },
    { key: 'profile', label: 'Perfil', icon: User, onClick: vi.fn() },
];

describe('MobileTabBar', () => {
    it('renders nav landmark', () => {
        render(<MobileTabBar items={items} activeKey="home" />);
        expect(screen.getByRole('navigation', { name: /navegação inferior/i })).toBeInTheDocument();
    });

    it('renders all items', () => {
        render(<MobileTabBar items={items} activeKey="home" />);
        expect(screen.getByRole('button', { name: /início/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /biblioteca/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /perfil/i })).toBeInTheDocument();
    });

    it('active item has aria-current=page', () => {
        render(<MobileTabBar items={items} activeKey="search" />);
        expect(screen.getByRole('button', { name: /buscar/i })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('button', { name: /início/i })).not.toHaveAttribute('aria-current');
    });

    it('calls onClick when item pressed', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        const testItems: TabBarItem[] = [{ key: 'home', label: 'Início', icon: Home, onClick }];
        render(<MobileTabBar items={testItems} activeKey="" />);
        await user.click(screen.getByRole('button', { name: /início/i }));
        expect(onClick).toHaveBeenCalled();
    });

    it('shows badge when badge > 0', () => {
        const withBadge: TabBarItem[] = [
            {
                key: 'home',
                label: 'Início',
                icon: Home,
                badge: 5,
                onClick: vi.fn(),
            },
        ];
        render(<MobileTabBar items={withBadge} activeKey="" />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows 99+ for badge > 99', () => {
        const withBadge: TabBarItem[] = [
            {
                key: 'home',
                label: 'Início',
                icon: Home,
                badge: 150,
                onClick: vi.fn(),
            },
        ];
        render(<MobileTabBar items={withBadge} activeKey="" />);
        expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('does not show badge element when badge is 0', () => {
        const withBadge: TabBarItem[] = [
            {
                key: 'home',
                label: 'Início',
                icon: Home,
                badge: 0,
                onClick: vi.fn(),
            },
        ];
        render(<MobileTabBar items={withBadge} activeKey="" />);
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
});
