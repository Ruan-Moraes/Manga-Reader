import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home, Search } from 'lucide-react';
import { SideMenu } from '../SideMenu';
import type { SideMenuSection } from '../SideMenu';

const sections: SideMenuSection[] = [
    {
        title: 'Descobrir',
        items: [
            { key: 'home', label: 'Início', icon: Home, onClick: vi.fn() },
            { key: 'search', label: 'Buscar', icon: Search, onClick: vi.fn() },
        ],
    },
];

describe('SideMenu', () => {
    it('renders nothing when closed', () => {
        render(<SideMenu open={false} onClose={vi.fn()} sections={sections} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog when open', () => {
        render(<SideMenu open onClose={vi.fn()} sections={sections} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders section title', () => {
        render(<SideMenu open onClose={vi.fn()} sections={sections} />);
        expect(screen.getByText('Descobrir')).toBeInTheDocument();
    });

    it('renders navigation items', () => {
        render(<SideMenu open onClose={vi.fn()} sections={sections} />);
        expect(screen.getByRole('button', { name: /início/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
    });

    it('highlights active item', () => {
        render(<SideMenu open onClose={vi.fn()} sections={sections} activeKey="home" />);
        const homeBtn = screen.getByRole('button', { name: /início/i });
        expect(homeBtn.className).toMatch(/border-mr-accent/);
    });

    it('calls item onClick and onClose when item clicked', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        const itemClick = vi.fn();
        const s: SideMenuSection[] = [
            {
                items: [
                    {
                        key: 'home',
                        label: 'Início',
                        icon: Home,
                        onClick: itemClick,
                    },
                ],
            },
        ];
        render(<SideMenu open onClose={onClose} sections={s} />);
        await user.click(screen.getByRole('button', { name: /início/i }));
        expect(itemClick).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('renders user block when user provided', () => {
        render(<SideMenu open onClose={vi.fn()} sections={sections} user={{ name: 'Ruan Barbosa', handle: 'ruan' }} />);
        expect(screen.getByText('Ruan Barbosa')).toBeInTheDocument();
        expect(screen.getByText('@ruan')).toBeInTheDocument();
    });

    it('renders footer slot', () => {
        render(<SideMenu open onClose={vi.fn()} sections={sections} footer={<button>Sair</button>} />);
        expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
    });

    it('has nav landmark with label', () => {
        render(<SideMenu open onClose={vi.fn()} sections={sections} />);
        expect(screen.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
    });

    it('closes on Escape key', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(<SideMenu open onClose={onClose} sections={sections} />);
        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalled();
    });
});
