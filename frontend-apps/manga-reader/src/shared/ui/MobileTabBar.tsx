import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

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
}

export const MobileTabBar = ({ items, activeKey }: MobileTabBarProps) => (
    <nav
        role="navigation"
        aria-label="Navegação inferior"
        className="fixed inset-x-0 bottom-0 z-mr-mobile-tab flex border-t-2 border-mr-tertiary bg-mr-primary pb-[env(safe-area-inset-bottom)] md:hidden"
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
                    className={cn(
                        'relative flex h-[60px] flex-1 flex-col items-center justify-center gap-1 transition-colors',
                        active ? 'text-mr-accent' : 'text-mr-fg-subtle hover:text-mr-fg',
                    )}
                >
                    <Icon className="size-6" aria-hidden="true" />
                    <span className="text-[10px] font-mr-bold uppercase tracking-[0.08em]">{it.label}</span>
                    {!!it.badge && (
                        <span className="absolute right-3 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-mr-full bg-mr-danger px-1 text-[10px] font-mr-extrabold text-mr-fg">
                            {it.badge > 99 ? '99+' : it.badge}
                        </span>
                    )}
                </button>
            );
        })}
    </nav>
);

export default MobileTabBar;
