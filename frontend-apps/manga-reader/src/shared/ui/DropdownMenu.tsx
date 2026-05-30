import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import * as RD from '@radix-ui/react-dropdown-menu';
import { Kbd } from './Kbd';
import { cn } from '@/lib/cn';

export interface DropdownMenuItem {
    type?: 'item' | 'separator' | 'label';
    label?: string;
    icon?: LucideIcon;
    onSelect?: () => void;
    destructive?: boolean;
    shortcut?: string;
    disabled?: boolean;
}

export interface DropdownMenuProps {
    trigger: ReactNode;
    items: DropdownMenuItem[];
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
}

export const DropdownMenu = ({ trigger, items, side = 'bottom', align = 'start' }: DropdownMenuProps) => (
    <RD.Root>
        <RD.Trigger asChild>{trigger}</RD.Trigger>
        <RD.Portal>
            <RD.Content
                side={side}
                align={align}
                sideOffset={6}
                className="z-mr-dropdown min-w-[180px] rounded-mr-sm border border-mr-border bg-mr-gray-900 p-1 shadow-mr-default animate-mr-fade-in"
            >
                {items.map((it, i) => {
                    const key = it.label ?? `${it.type ?? 'item'}-${i}`;

                    if (it.type === 'separator') {
                        return <RD.Separator key={key} className="my-1 h-px bg-mr-border-subtle" />;
                    }

                    if (it.type === 'label') {
                        return (
                            <RD.Label key={key} className="mr-label px-3 py-1 text-mr-fg-subtle">
                                {it.label}
                            </RD.Label>
                        );
                    }

                    const Icon = it.icon;

                    return (
                        <RD.Item
                            key={key}
                            disabled={it.disabled}
                            onSelect={it.onSelect}
                            className={cn(
                                'flex h-9 cursor-pointer items-center gap-2 rounded-mr-xs px-3 text-mr-body outline-none data-[highlighted]:bg-mr-accent-25 data-[disabled]:opacity-mr-disabled',
                                it.destructive ? 'text-mr-danger data-[highlighted]:bg-[rgba(255,120,79,0.1)]' : 'text-mr-fg',
                            )}
                        >
                            {Icon && <Icon className="size-4" aria-hidden="true" />}
                            <span className="flex-1">{it.label}</span>
                            {it.shortcut && <Kbd size="sm">{it.shortcut}</Kbd>}
                        </RD.Item>
                    );
                })}
            </RD.Content>
        </RD.Portal>
    </RD.Root>
);

export default DropdownMenu;
