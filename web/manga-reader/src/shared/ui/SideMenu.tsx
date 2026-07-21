import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Drawer } from './Drawer';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { cn } from '@shared/lib/cn';

export interface SideMenuItem {
    key: string;
    label: string;
    icon: LucideIcon;
    href?: string;
    badge?: string | number;
    onClick?: () => void;
}

export interface SideMenuSection {
    title?: string;
    items: SideMenuItem[];
}

export interface SideMenuProps {
    open: boolean;
    onClose: () => void;
    sections: SideMenuSection[];
    user?: { name: string; handle?: string; avatar?: string } | null;
    activeKey?: string;
    footer?: ReactNode;
}

export const SideMenu = ({ open, onClose, sections, user, activeKey, footer }: SideMenuProps) => (
    <Drawer open={open} onClose={onClose} side="left" width={320}>
        <div className="flex h-full flex-col">
            {user && (
                <div className="mb-4 flex items-center gap-3 border-b border-mr-border-subtle pb-4">
                    <Avatar src={user.avatar} name={user.name} size={48} />
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-mr-body font-mr-extrabold text-mr-fg">{user.name}</div>
                        {user.handle && <div className="truncate text-mr-tiny text-mr-fg-subtle">@{user.handle}</div>}
                    </div>
                </div>
            )}

            <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-4 overflow-y-auto scrollbar-hidden">
                {sections.map((s, si) => (
                    <div key={si} className="flex flex-col gap-1">
                        {s.title && <div className="mr-label pl-1 px-3 text-mr-fg-subtle mb-2">{s.title}</div>}
                        {s.items.map(it => {
                            const Icon = it.icon;
                            const active = activeKey === it.key;

                            return (
                                <button
                                    key={it.key}
                                    type="button"
                                    onClick={() => {
                                        it.onClick?.();
                                        onClose();
                                    }}
                                    className={cn(
                                        'flex py-2.5 items-center gap-3 rounded-mr-xs px-3 text-mr-body transition-colors duration-mr-default',
                                        active
                                            ? 'border-l-[3px] border-mr-accent-border bg-mr-accent-25 font-mr-extrabold text-mr-accent-fg'
                                            : 'text-mr-fg-muted hover:bg-mr-accent-25 hover:text-mr-fg',
                                    )}
                                >
                                    <Icon className="size-5" aria-hidden="true" />
                                    <span className="flex-1 text-left">{it.label}</span>
                                    {it.badge != null && <Badge variant="neutral">{it.badge}</Badge>}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {footer && <div className="mt-4 border-t border-mr-border-subtle pt-4">{footer}</div>}
        </div>
    </Drawer>
);

export default SideMenu;
