import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings, Trash } from 'lucide-react';
import { DropdownMenu } from '../DropdownMenu';
import type { DropdownMenuItem } from '../DropdownMenu';
import { Button } from '../Button';

const items: DropdownMenuItem[] = [
    { label: 'Configurações', icon: Settings, onSelect: vi.fn() },
    { type: 'separator' },
    { label: 'Excluir', icon: Trash, destructive: true, onSelect: vi.fn() },
    { label: 'Desabilitado', disabled: true, onSelect: vi.fn() },
];

const renderMenu = (customItems = items) => render(<DropdownMenu trigger={<Button variant="ghost">Abrir menu</Button>} items={customItems} />);

describe('DropdownMenu', () => {
    it('renders trigger', () => {
        renderMenu();
        expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument();
    });

    it('menu is not visible before trigger click', () => {
        renderMenu();
        expect(screen.queryByRole('menuitem', { name: /configurações/i })).not.toBeInTheDocument();
    });

    it('opens menu on trigger click', async () => {
        const user = userEvent.setup();
        renderMenu();
        await user.click(screen.getByRole('button', { name: /abrir menu/i }));
        await waitFor(() => {
            expect(screen.getByRole('menuitem', { name: /configurações/i })).toBeInTheDocument();
        });
    });

    it('calls onSelect when item clicked', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(<DropdownMenu trigger={<Button variant="ghost">Abrir</Button>} items={[{ label: 'Ação', onSelect }]} />);
        await user.click(screen.getByRole('button', { name: /abrir/i }));
        await waitFor(() => screen.getByRole('menuitem', { name: /ação/i }));
        await user.click(screen.getByRole('menuitem', { name: /ação/i }));
        expect(onSelect).toHaveBeenCalled();
    });

    it('shows shortcut kbd when provided', async () => {
        const user = userEvent.setup();
        render(<DropdownMenu trigger={<Button variant="ghost">Abrir</Button>} items={[{ label: 'Salvar', shortcut: '⌘S' }]} />);
        await user.click(screen.getByRole('button', { name: /abrir/i }));
        await waitFor(() => expect(screen.getByText('⌘S')).toBeInTheDocument());
    });

    it('disabled item is not selectable', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(<DropdownMenu trigger={<Button variant="ghost">Abrir</Button>} items={[{ label: 'Bloqueado', disabled: true, onSelect }]} />);
        await user.click(screen.getByRole('button', { name: /abrir/i }));
        await waitFor(() => screen.getByRole('menuitem', { name: /bloqueado/i }));
        await user.click(screen.getByRole('menuitem', { name: /bloqueado/i }));
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('renders label group item', async () => {
        const user = userEvent.setup();
        render(<DropdownMenu trigger={<Button variant="ghost">Abrir</Button>} items={[{ type: 'label', label: 'Grupo' }]} />);
        await user.click(screen.getByRole('button', { name: /abrir/i }));
        await waitFor(() => expect(screen.getByText('Grupo')).toBeInTheDocument());
    });
});
