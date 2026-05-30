import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { LayoutNavBarProps } from './navBar.types';
export type { LayoutNavBarUser, LayoutNavBarProps } from './navBar.types';

import NavMegaMenu from './NavMegaMenu';
import NavActions from './NavActions';
import NavSearch from './NavSearch';
import useNavSearch from './useNavSearch';
import Logo from '@shared/component/logo/Logo.tsx';

const SCROLL_THRESHOLD = 8;

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
    const [isScrolled, setIsScrolled] = useState(false);

    const { searchValue, setSearchValue, searchFocused, setSearchFocused, inputRef, handleSearch, focusSearch } = useNavSearch(onSearchSubmit);

    useEffect(() => {
        let raf = 0;

        const onScroll = () => {
            if (raf) return;

            raf = requestAnimationFrame(() => {
                setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
                raf = 0;
            });
        };

        onScroll();

        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);

            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();

                focusSearch();

                setSearchFocused(true);
            }

            if (e.key === 'Escape') {
                setOpenSection(null);

                setSearchFocused(false);

                (document.activeElement as HTMLElement | null)?.blur?.();
            }
        };

        document.addEventListener('keydown', onKey);

        return () => document.removeEventListener('keydown', onKey);
    }, [focusSearch, setSearchFocused]);

    const desktopBandHeight = isScrolled ? 54 : 68;
    const desktopFieldHeight = isScrolled ? 38 : 42;
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
                className="mx-auto hidden max-w-mr-container items-center gap-[10px] px-[18px] md:flex"
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

                <div className="shrink-0">
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
                            height={desktopFieldHeight}
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

            <div className="flex flex-col md:hidden">
                <div className="flex items-center gap-[10px] px-[14px]" style={{ height: 56 }}>
                    <button
                        type="button"
                        aria-label={t('navigation.openMenu')}
                        onClick={onOpenSideMenu}
                        className="inline-flex shrink-0 items-center justify-center rounded-mr-xs border border-transparent text-mr-fg transition-colors duration-mr-default hover:bg-mr-secondary hover:border-mr-gray-700 focus-visible:outline-2 focus-visible:outline-mr-accent"
                        style={{ width: 44, height: 44 }}
                    >
                        <Menu className="size-[22px]" strokeWidth={2} aria-hidden="true" />
                    </button>

                    <div className="shrink-0">
                        <Logo size="sm" onNavigate={onNavigate} />
                    </div>

                    <div className="ml-auto">
                        <NavActions
                            user={user}
                            compact
                            iconSize={44}
                            onNotificationsClick={onNotificationsClick}
                            onProfileClick={onProfileClick}
                            onSettingsClick={onSettingsClick}
                            onLogoutClick={onLogoutClick}
                            onAccountClick={onAccountClick}
                        />
                    </div>
                </div>

                <div className="px-[14px] pb-3">
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
                        height={44}
                        showShortcut={false}
                    />
                </div>
            </div>
        </header>
    );
};

export default NavBar;
