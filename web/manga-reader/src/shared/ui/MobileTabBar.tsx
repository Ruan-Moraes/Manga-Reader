import type { LucideIcon } from 'lucide-react';

import { cn } from '@shared/lib/cn';

export interface TabBarItem {
    key: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
    onClick: () => void;
}

export interface MobileTabBarProps {
    items: TabBarItem[];
    activeKey: string;
    visible?: boolean;
}

export const MobileTabBar = ({ items, activeKey, visible = true }: MobileTabBarProps) => (
    <nav
        role="navigation"
        aria-label="Navegação inferior"
        className={cn(
            'fixed inset-x-0 bottom-0 z-mr-mobile-tab flex border-t-2 border-mr-tertiary bg-mr-primary pb-[env(safe-area-inset-bottom)] transition-transform duration-mr-default md:hidden',
            visible ? 'translate-y-0' : 'translate-y-full',
        )}
    >
        {items.map(it => {
            const active = it.key === activeKey;
            const Icon = it.icon;
            return (
                <button
                    key={it.key}
                    type="button"
                    onClick={it.onClick}
                    aria-current={active ? 'page' : undefined}
                    aria-label={it.label}
                    // h-[52px] precisa ficar em sincronia com o pb-[calc(52px+...)] do RootLayout.tsx
                    className={cn(
                        'relative flex h-[52px] flex-1 items-center justify-center transition-colors',
                        active ? 'text-mr-accent-fg' : 'text-mr-fg-subtle hover:text-mr-fg',
                    )}
                >
                    <span className={cn('flex items-center justify-center rounded-mr-full p-2 transition-colors', active && 'bg-mr-accent-25')}>
                        <Icon className="size-6" aria-hidden="true" />
                    </span>
                    {!!it.badge && (
                        <span className="absolute right-3 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-mr-full bg-mr-danger px-1 text-[10px] font-mr-extrabold text-mr-fg">
                            {it.badge > 99 ? '99+' : it.badge}
                        </span>
                    )}
                </button>
            );
        })}
    </nav>
);

export default MobileTabBar;
