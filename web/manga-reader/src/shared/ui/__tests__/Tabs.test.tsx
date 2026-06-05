import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from '../Tabs';
import type { TabItem } from '../Tabs';

const items: TabItem[] = [
    { value: 'a', label: 'Aba A' },
    { value: 'b', label: 'Aba B' },
    { value: 'c', label: 'Aba C', disabled: true },
];

describe('Tabs', () => {
    it('renders all tab labels', () => {
        render(<Tabs items={items} value="a" onChange={vi.fn()} />);
        expect(screen.getByRole('tab', { name: /aba a/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /aba b/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /aba c/i })).toBeInTheDocument();
    });

    it('active tab has aria-selected=true', () => {
        render(<Tabs items={items} value="b" onChange={vi.fn()} />);
        expect(screen.getByRole('tab', { name: /aba b/i })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', { name: /aba a/i })).toHaveAttribute('aria-selected', 'false');
    });

    it('calls onChange with correct value when tab clicked', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Tabs items={items} value="a" onChange={onChange} />);
        await user.click(screen.getByRole('tab', { name: /aba b/i }));
        expect(onChange).toHaveBeenCalledWith('b');
    });

    it('disabled tab is not clickable', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Tabs items={items} value="a" onChange={onChange} />);
        await user.click(screen.getByRole('tab', { name: /aba c/i }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('disabled tab has disabled attribute', () => {
        render(<Tabs items={items} value="a" onChange={vi.fn()} />);
        expect(screen.getByRole('tab', { name: /aba c/i })).toBeDisabled();
    });

    it('container has role=tablist', () => {
        render(<Tabs items={items} value="a" onChange={vi.fn()} />);
        expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders pills variant', () => {
        render(<Tabs items={items} value="a" onChange={vi.fn()} variant="pills" />);
        expect(screen.getByRole('tablist')).toBeInTheDocument();
        expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    it('renders sm size', () => {
        render(<Tabs items={items} value="a" onChange={vi.fn()} size="sm" />);
        expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    it('renders badge in tab', () => {
        const withBadge: TabItem[] = [{ value: 'x', label: 'Com badge', badge: <span>3</span> }];
        render(<Tabs items={withBadge} value="x" onChange={vi.fn()} />);
        expect(screen.getByText('3')).toBeInTheDocument();
    });
});
