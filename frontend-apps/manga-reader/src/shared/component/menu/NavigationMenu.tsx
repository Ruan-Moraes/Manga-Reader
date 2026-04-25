import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IoMenu } from 'react-icons/io5';

import { clsx } from 'clsx';

import AppLink from '@shared/component/link/element/AppLink';
import SidebarMenuContent from '@shared/component/link/section/SidebarMenuContent';
import { showInfoToast } from '@shared/service/util/toastService';
import useMenuData from '@shared/hook/useMenuData';

import { useAuth } from '@feature/auth';

const NavigationMenu = () => {
    const { t } = useTranslation('layout');
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isSticky, setIsSticky] = useState<boolean>(false);

    const [menuHeight, setMenuHeight] = useState<number>(0);
    const [menuSearch, setMenuSearch] = useState('');

    const { user, isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();
    const { savedCount } = useMenuData(isLoggedIn);

    const menuRef = useRef<HTMLDivElement>(null);
    const originalOffset = useRef<number>(0);

    const currentProfile = useMemo(() => {
        if (isLoggedIn && user) {
            const role = user.role ?? 'user';
            const isAdmin = role === 'admin';
            const isPoster = role === 'poster' || role === 'admin';
            const planBadge = isAdmin
                ? t('sidebar.role.adminBadge')
                : isPoster
                  ? t('sidebar.role.posterBadge')
                  : '';

            return {
                id: user.id,
                label: isAdmin
                    ? t('sidebar.role.admin')
                    : isPoster
                      ? t('sidebar.role.poster')
                      : t('sidebar.role.user'),
                fullName: user.name,
                email: user.email,
                planBadge: planBadge || undefined,
                savedCount,
                canDownload: true,
                isAdmin,
                isPoster,
            };
        }

        return { id: 'visitor', label: t('sidebar.role.visitor') };
    }, [isLoggedIn, user, savedCount, t]);

    const toggleMenu = useCallback(() => {
        setIsMenuOpen(prevOpen => !prevOpen);
    }, []);

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
    }, []);

    const handleScroll = useCallback(() => {
        if (menuRef.current) {
            const currentScroll = window.scrollY;

            setIsSticky(currentScroll > originalOffset.current);
        }
    }, []);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeMenu();
            }
        },
        [closeMenu],
    );

    useLayoutEffect(() => {
        if (menuRef.current) {
            originalOffset.current = menuRef.current.offsetTop;

            setMenuHeight(menuRef.current.offsetHeight / 16);
        }

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown, handleScroll]);

    useLayoutEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMenuOpen]);

    const sidebarContent = (
        <>
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}
            <aside
                className={clsx(
                    'flex flex-col gap-4 w-full max-w-md fixed top-0 bottom-0 left-0 bg-primary-default border-r-2 border-r-tertiary z-50 transform transition-transform duration-300',
                    {
                        'translate-x-0': isMenuOpen,
                        '-translate-x-full': !isMenuOpen,
                    },
                )}
                id="menu-links"
                role="dialog"
                aria-label={t('navigation.dialogLabel')}
                aria-modal="true"
            >
                <div className="flex items-center justify-between gap-2 p-4 border-b-2 border-b-tertiary">
                    <h2 className="text-xl italic font-bold mobile-sm:text-lg mobile-md:text-xl">
                        <AppLink text={t('header.brand')} link="/" />
                    </h2>
                    <button
                        type="button"
                        onClick={closeMenu}
                        className="h-10 px-4 text-xs font-semibold uppercase border rounded-xs border-tertiary hover:bg-tertiary/20 cursor-pointer"
                    >
                        {t('navigation.close')}
                    </button>
                </div>

                <div className="px-4">
                    <form
                        role="search"
                        className="flex gap-2"
                        onSubmit={e => {
                            e.preventDefault();
                            const trimmed = menuSearch.trim();
                            if (trimmed) {
                                navigate(
                                    `/Manga-Reader/search?q=${encodeURIComponent(trimmed)}`,
                                );
                                closeMenu();
                                setMenuSearch('');
                            }
                        }}
                    >
                        <input
                            name="menu-search"
                            type="search"
                            placeholder={t('search.menuPlaceholder')}
                            className="w-full h-10 px-3 text-sm border bg-secondary rounded-xs border-tertiary placeholder:text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quaternary-default"
                            value={menuSearch}
                            onChange={e => setMenuSearch(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="h-10 px-4 text-xs font-semibold uppercase border rounded-xs border-tertiary hover:bg-tertiary/20 cursor-pointer"
                        >
                            {t('search.submit')}
                        </button>
                    </form>
                </div>
                <SidebarMenuContent
                    profile={currentProfile}
                    isLoggedIn={isLoggedIn}
                    onLogout={() => {
                        logout();
                        showInfoToast(t('sidebar.logoutMessage'));
                        closeMenu();
                    }}
                    onNavigate={closeMenu}
                />
            </aside>
        </>
    );

    return (
        <>
            {isSticky && <div style={{ height: `${menuHeight}rem` }} />}
            <nav
                className={clsx(
                    'px-3 py-2 bg-secondary border-b-2 border-b-tertiary transition duration-300',
                    {
                        'fixed top-0 left-0 right-0 z-20': isSticky,
                    },
                )}
                ref={menuRef}
            >
                <div className="flex items-center justify-between">
                    <div
                        className={clsx(
                            'transition duration-300 text-xl font-bold text-center',
                            {
                                'opacity-100': isSticky,
                                'opacity-0': !isSticky,
                            },
                        )}
                    >
                        <h2
                            className={clsx('italic', {
                                'pointer-events-none': !isSticky,
                            })}
                        >
                            <AppLink text={t('header.brand')} link="/" />
                        </h2>
                    </div>
                    <button
                        type="button"
                        aria-controls="menu-links"
                        aria-expanded={isMenuOpen}
                        aria-label={t('navigation.openMenu')}
                        onClick={toggleMenu}
                        className="cursor-pointer"
                    >
                        <IoMenu fontSize="2.5rem" />
                    </button>
                </div>
            </nav>
            {createPortal(sidebarContent, document.body)}
        </>
    );
};

export default NavigationMenu;
