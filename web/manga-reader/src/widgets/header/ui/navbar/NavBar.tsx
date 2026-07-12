import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { LayoutNavBarProps } from './navBar.types';
export type { LayoutNavBarUser, LayoutNavBarProps } from './navBar.types';

import NavMegaMenu from './NavMegaMenu';
import NavActions from './NavActions';
import NavSearch from './NavSearch';
import useNavSearch from '../../model/useNavSearch';
import useNavBarChrome from '../../model/useNavBarChrome';
import Logo from '@ui/Logo';

export const NavBar = ({
    user,
    onNavigate,
    onOpenSideMenu,
    onSearchSubmit,
    onNotificationsClick,
    onLibraryClick,
    onProfileClick,
    onSettingsClick,
    onLogoutClick,
    onAccountClick,
}: LayoutNavBarProps) => {
    const { t } = useTranslation('layout');

    const [openSection, setOpenSection] = useState<string | null>(null);

    const { searchValue, setSearchValue, searchFocused, setSearchFocused, inputRef, handleSearch, focusSearch } = useNavSearch(onSearchSubmit);

    const { isScrolled } = useNavBarChrome({ focusSearch, setSearchFocused, setOpenSection });

    const desktopBandHeight = isScrolled ? 54 : 68;
    const desktopActionSize = isScrolled ? 38 : 42;
    const logoSize: 'sm' | 'md' = isScrolled ? 'sm' : 'md';

    const headerStyle = {
        background: 'var(--mr-primary)',
        borderBottom: isScrolled ? '1px solid var(--mr-tertiary)' : '1px solid #242424',
        boxShadow: isScrolled ? '0 2px 0 0 rgba(221,218,42,0.25)' : 'none',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        zIndex: 40,
        isolation: 'isolate' as const,
    };

    const onSelectRecent = (q: string) => {
        setSearchValue('');
        setSearchFocused(false);

        onSearchSubmit?.(q);
    };

    const onSelectSuggestion = (s: { key: string }) => {
        setSearchFocused(false);

        onNavigate(`/manga/${s.key}`);
    };

    return (
        <header role="banner" className="sticky top-0" style={headerStyle}>
            <div
                className="mx-auto hidden max-w-mr-container items-center gap-[10px] px-4 sm:px-5 lg:px-6 md:flex"
                style={{ height: desktopBandHeight, transition: 'height 0.3s ease' }}
            >
                <button
                    type="button"
                    aria-label={t('navigation.openMenu')}
                    onClick={onOpenSideMenu}
                    className="hidden shrink-0 items-center justify-center rounded-mr-xs border border-transparent text-mr-fg transition-colors duration-mr-default hover:bg-mr-secondary hover:border-mr-gray-700 focus-visible:outline-2 focus-visible:outline-mr-accent md:inline-flex lg:!hidden"
                    style={{ width: 42, height: 42 }}
                >
                    <Menu className="size-[20px]" strokeWidth={2} aria-hidden="true" />
                </button>

                <div className="hidden shrink-0 lg:block">
                    <Logo size={logoSize} onNavigate={onNavigate} />
                </div>

                <NavMegaMenu openSection={openSection} onSectionChange={setOpenSection} onNavigate={onNavigate} />

                <div className="flex flex-1 justify-center">
                    <div className="w-full">
                        <NavSearch
                            value={searchValue}
                            onChange={setSearchValue}
                            focused={searchFocused}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            onSubmit={handleSearch}
                            onSelectRecent={onSelectRecent}
                            onSelectSuggestion={onSelectSuggestion}
                            inputRef={inputRef}
                        />
                    </div>
                </div>

                <div className="ml-auto shrink-0">
                    <NavActions
                        user={user}
                        iconSize={desktopActionSize}
                        onNotificationsClick={onNotificationsClick}
                        onLibraryClick={onLibraryClick}
                        onProfileClick={onProfileClick}
                        onSettingsClick={onSettingsClick}
                        onLogoutClick={onLogoutClick}
                        onAccountClick={onAccountClick}
                    />
                </div>
            </div>

            <div data-testid="mobile-header" className="flex min-h-16 items-center gap-2 border-b border-mr-gray-800 px-3 py-2 md:hidden">
                <button
                    type="button"
                    aria-label={t('navigation.openMenu')}
                    onClick={onOpenSideMenu}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-mr-xs border border-transparent text-mr-fg transition-colors duration-mr-default hover:border-mr-gray-700 hover:bg-mr-secondary focus-visible:outline-2 focus-visible:outline-mr-accent"
                >
                    <Menu className="size-5" strokeWidth={2} aria-hidden="true" />
                </button>

                <div className="min-w-0 flex-1">
                    <NavSearch
                        value={searchValue}
                        onChange={setSearchValue}
                        focused={searchFocused}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        onSubmit={handleSearch}
                        onSelectRecent={onSelectRecent}
                        onSelectSuggestion={onSelectSuggestion}
                        inputRef={inputRef}
                        showShortcut={false}
                    />
                </div>

                <div className="shrink-0">
                    <NavActions
                        user={user}
                        compact
                        iconSize={40}
                        onNotificationsClick={onNotificationsClick}
                        onProfileClick={onProfileClick}
                        onSettingsClick={onSettingsClick}
                        onLogoutClick={onLogoutClick}
                        onAccountClick={onAccountClick}
                    />
                </div>
            </div>
        </header>
    );
};

export default NavBar;
