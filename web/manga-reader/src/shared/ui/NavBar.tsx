import { useState } from 'react';
import { Menu, Bell, BookOpen, Search } from 'lucide-react';

import { IconButton } from './IconButton';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { SearchField } from './SearchField';
import { DropdownMenu } from './DropdownMenu';

export interface NavLink {
    key: string;
    label: string;
    onClick?: () => void;
}

export interface NavBarUser {
    name: string;
    avatar?: string;
    notificationCount?: number;
    libraryCount?: number;
}

export interface NavBarProps {
    links: NavLink[];
    user?: NavBarUser | null;
    onLogoClick?: () => void;
    onAccountClick?: () => void;
    onMenuClick: () => void;
    searchValue?: string;
    onSearchChange?: (v: string) => void;
    onSearchSubmit?: (v: string) => void;
    onNotificationsClick?: () => void;
    onLibraryClick?: () => void;
    onProfileClick?: () => void;
    onSettingsClick?: () => void;
    onLogoutClick?: () => void;
    activeKey?: string;
}

const Wordmark = ({ onClick }: { onClick?: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label="Manga Reader, ir para home"
        className="font-mr-sans font-mr-extrabold italic tracking-mr-logo text-mr-fg shrink-0"
    >
        Manga <span className="text-mr-accent-fg">Reader</span>
    </button>
);

export const NavBar = ({
    links,
    user,
    onLogoClick,
    onAccountClick,
    onMenuClick,
    searchValue = '',
    onSearchChange,
    onSearchSubmit,
    onNotificationsClick,
    onLibraryClick,
    onProfileClick,
    onSettingsClick,
    onLogoutClick,
    activeKey,
}: NavBarProps) => {
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    const accountItems = user
        ? [
              { label: 'Perfil', onSelect: onProfileClick },
              { label: 'Configurações', onSelect: onSettingsClick },
              { type: 'separator' as const },
              { label: 'Sair', destructive: true, onSelect: onLogoutClick },
          ]
        : [];

    return (
        <header role="banner" className="sticky top-0 z-mr-header border-b-2 border-mr-tertiary bg-mr-primary">
            <div className="mx-auto flex h-16 max-w-mr-container items-center gap-3 px-4 sm:px-5 lg:px-6 md:h-[72px]">
                <IconButton icon={Menu} aria-label="Abrir menu" onClick={onMenuClick} className="shrink-0" />

                <Wordmark onClick={onLogoClick} />

                {links.length > 0 && (
                    <nav aria-label="Principal" className="hidden md:flex items-center gap-1">
                        {links.map(l => (
                            <button
                                key={l.key}
                                type="button"
                                onClick={l.onClick}
                                className={`px-3 py-2 text-mr-small font-mr-bold rounded-mr-xs transition-colors duration-mr-default ${
                                    activeKey === l.key ? 'text-mr-accent-fg' : 'text-mr-fg-muted hover:text-mr-fg'
                                }`}
                            >
                                {l.label}
                            </button>
                        ))}
                    </nav>
                )}

                <div className="hidden md:flex flex-1 max-w-xs">
                    <SearchField
                        value={searchValue}
                        onChange={v => onSearchChange?.(v)}
                        onKeyDown={e => e.key === 'Enter' && onSearchSubmit?.(searchValue)}
                        shortcut="⌘K"
                        className="w-full"
                    />
                </div>

                <div className="flex-1 md:hidden" />

                <div className="flex items-center gap-1 md:hidden">
                    <IconButton icon={Search} aria-label="Buscar" onClick={() => setMobileSearchOpen(v => !v)} />
                </div>

                <div className="hidden md:flex items-center gap-1">
                    {user && (
                        <>
                            <div className="relative">
                                <IconButton icon={Bell} aria-label="Notificações" onClick={onNotificationsClick} />
                                {!!user.notificationCount && (
                                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-mr-full bg-mr-danger px-1 text-[10px] font-mr-extrabold text-mr-fg">
                                        {user.notificationCount > 9 ? '9+' : user.notificationCount}
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <IconButton icon={BookOpen} aria-label="Biblioteca" onClick={onLibraryClick} />
                                {!!user.libraryCount && (
                                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-mr-full bg-mr-accent px-1 text-[10px] font-mr-extrabold text-mr-on-accent">
                                        {user.libraryCount > 99 ? '99+' : user.libraryCount}
                                    </span>
                                )}
                            </div>
                            <DropdownMenu
                                trigger={
                                    <button type="button" aria-label={`Conta de ${user.name}`} className="mr-focus-ring">
                                        <Avatar src={user.avatar} name={user.name} size={32} onClick={undefined} />
                                    </button>
                                }
                                items={accountItems}
                                side="bottom"
                                align="end"
                            />
                        </>
                    )}
                    {!user && (
                        <Button variant="primary" size="sm" onClick={onAccountClick}>
                            Entrar
                        </Button>
                    )}
                </div>
            </div>

            {mobileSearchOpen && (
                <div className="border-t border-mr-border-subtle px-4 py-2 md:hidden">
                    <SearchField
                        value={searchValue}
                        onChange={v => onSearchChange?.(v)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                onSearchSubmit?.(searchValue);

                                setMobileSearchOpen(false);
                            }
                        }}
                        autoFocus
                    />
                </div>
            )}
        </header>
    );
};

export default NavBar;
