import type { ReactNode } from 'react';
import { Check, type LucideIcon } from 'lucide-react';

import * as RD from '@radix-ui/react-dropdown-menu';
import { Kbd } from './Kbd';
import { cn } from '@shared/lib/cn';
import { useFloatingPortalContainer } from './FloatingPortalContext';

export interface DropdownMenuItem {
    type?: 'item' | 'separator' | 'label';
    label?: string;
    icon?: LucideIcon;
    onSelect?: () => void;
    destructive?: boolean;
    selected?: boolean;
    shortcut?: string;
    disabled?: boolean;
}

export interface DropdownMenuProps {
    trigger: ReactNode;
    items: DropdownMenuItem[];
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
    avoidCollisions?: boolean;
    modal?: boolean;
}

export const DropdownMenu = ({ trigger, items, side = 'bottom', align = 'start', avoidCollisions = true, modal = true }: DropdownMenuProps) => {
    // Dentro de um Modal (<dialog> na top layer), o menu precisa portalar para o próprio dialog.
    const portalContainer = useFloatingPortalContainer();

    return (
        <RD.Root modal={modal}>
            <RD.Trigger asChild>{trigger}</RD.Trigger>
            <RD.Portal container={portalContainer ?? undefined}>
                <RD.Content
                    side={side}
                    align={align}
                    avoidCollisions={avoidCollisions}
                    sideOffset={8}
                    style={{
                        zIndex: 'var(--z-index-mr-dropdown)',
                        borderRadius: 8,
                        boxShadow: '-0.25rem 0.25rem 0 0 var(--mr-accent-25), var(--mr-elevated-shadow)',
                    }}
                    className="flex min-w-[220px] flex-col gap-px bg-mr-secondary p-1.5 animate-mr-fade-in"
                >
                    {items.map((it, i) => {
                        const key = it.label ?? `${it.type ?? 'item'}-${i}`;

                        if (it.type === 'separator') {
                            return <RD.Separator key={key} className="-mx-1.5 my-1.5 h-px bg-mr-border-subtle" />;
                        }

                        if (it.type === 'label') {
                            return (
                                <RD.Label key={key} className="mr-label select-none px-2 pb-2 pt-1.5 text-mr-fg-subtle [&:not(:first-child)]:mt-1">
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
                                    'flex h-9 cursor-pointer items-center gap-2.5 rounded-mr-xs px-2.5 text-mr-body outline-none data-[highlighted]:bg-mr-accent-25 data-[disabled]:cursor-default data-[disabled]:opacity-mr-disabled',
                                    it.destructive ? 'text-mr-danger data-[highlighted]:bg-mr-danger-15' : 'text-mr-fg',
                                )}
                            >
                                {Icon && <Icon className="size-4 shrink-0 text-mr-fg-muted" aria-hidden="true" />}
                                <span className="flex-1 truncate">{it.label}</span>
                                {it.selected && <Check className="size-4 shrink-0 text-mr-accent-fg" aria-hidden="true" />}
                                {it.shortcut && <Kbd size="sm">{it.shortcut}</Kbd>}
                            </RD.Item>
                        );
                    })}
                </RD.Content>
            </RD.Portal>
        </RD.Root>
    );
};

export default DropdownMenu;
