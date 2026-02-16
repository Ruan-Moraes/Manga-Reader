import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { clsx } from 'clsx';

import AppLink from '@shared/component/link/element/AppLink';
import Overlay from '@shared/component/blur/Overlay';
import SidebarMenuContent, {
    MenuProfile,
} from '@shared/component/link/section/SidebarMenuContent';
import { useAuth } from '@feature/auth';
import { showInfoToast } from '@shared/service/util/toastService';

const menuProfiles: MenuProfile[] = [
    {
        id: 'visitor',
        label: 'Visitante',
        isVisitor: true,
    },
    {
        id: 'user',
        label: 'Usuário',
        fullName: 'Leitor Demo',
        email: 'leitor.demo@mangareader.com',
        planBadge: '[Pro]',
        savedCount: 12,
        unreadNotifications: 3,
        newsBadge: '+4',
        eventBadge: '2 próximos',
        canDownload: true,
        isAdmin: false,
    },
    {
        id: 'admin',
        label: 'Administrador',
        fullName: 'Admin Demo',
        email: 'admin@mangareader.com',
        planBadge: '[Admin]',
        savedCount: 38,
        unreadNotifications: 12,
        newsBadge: '+8',
        eventBadge: '5 próximos',
        canDownload: true,
        isAdmin: true,
    },
];

const NavigationMenu = () => {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isSticky, setIsSticky] = useState<boolean>(false);
    const [menuHeight, setMenuHeight] = useState<number>(0);
    const [selectedProfileId, setSelectedProfileId] =
        useState<string>('visitor');

    const { user, isLoggedIn, logout } = useAuth();

    const menuRef = useRef<HTMLDivElement>(null);
    const originalOffset = useRef<number>(0);

    const selectedMockProfile = useMemo(
        () => menuProfiles.find(profile => profile.id === selectedProfileId),
        [selectedProfileId],
    );

    const currentProfile = useMemo(() => {
        if (isLoggedIn && user) {
            const isAdmin = Boolean(user.moderator?.isModerator);

            return {
                id: isAdmin ? 'admin-real' : 'user-real',
                label: isAdmin ? 'Administrador' : 'Usuário',
                fullName: user.name,
                email: `${user.name.toLowerCase().replace(/\s+/g, '.')}@mangareader.com`,
                planBadge: isAdmin ? '[Admin]' : '[Pro]',
                savedCount: 12,
                unreadNotifications: 4,
                newsBadge: '+2',
                eventBadge: '2 próximos',
                canDownload: true,
                isAdmin,
            } satisfies MenuProfile;
        }

        return selectedMockProfile ?? menuProfiles[0];
    }, [isLoggedIn, selectedMockProfile, user]);

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
                            <AppLink text="Manga Reader" />
                        </h2>
                    </div>
                    <button
                        type="button"
                        aria-controls="menu-links"
                        aria-expanded={isMenuOpen}
                        onClick={toggleMenu}
                        className="h-10 px-5 text-sm font-semibold tracking-wide uppercase border rounded-xs border-tertiary bg-primary-default hover:bg-tertiary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quaternary-default"
                    >
                        Menu
                    </button>
                </div>
                <div className="absolute">
                    <aside
                        className={clsx(
                            'flex flex-col gap-4 w-full max-w-md fixed top-0 bottom-0 left-0 bg-primary-default border-r-2 border-r-tertiary z-30 transform transition-transform duration-300',
                            {
                                'translate-x-0': isMenuOpen,
                                '-translate-x-full': !isMenuOpen,
                            },
                        )}
                        id="menu-links"
                        role="dialog"
                        aria-label="Menu principal"
                        aria-modal="true"
                    >
                        <div className="flex items-center justify-between gap-2 p-4 border-b-2 border-b-tertiary">
                            <h2 className="text-xl italic font-bold mobile-sm:text-lg mobile-md:text-xl">
                                <AppLink text="Manga Reader" />
                            </h2>
                            <button
                                type="button"
                                onClick={closeMenu}
                                className="h-9 px-4 text-xs font-semibold uppercase border rounded-xs border-tertiary hover:bg-tertiary/20"
                            >
                                Fechar
                            </button>
                        </div>

                        <div className="px-4">
                            <form role="search" className="flex gap-2">
                                <input
                                    name="menu-search"
                                    type="search"
                                    placeholder="Buscar mangás, notícias, grupos..."
                                    className="w-full h-10 px-3 text-sm bg-secondary border rounded-xs border-tertiary placeholder:text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quaternary-default"
                                />
                                <button
                                    type="submit"
                                    className="h-10 px-4 text-sm font-semibold border rounded-xs border-tertiary hover:bg-tertiary/20"
                                >
                                    Buscar
                                </button>
                            </form>
                        </div>

                        {!isLoggedIn && (
                            <div className="px-4">
                                <div className="p-3 text-xs border rounded-xs border-tertiary bg-secondary/40">
                                    <p className="mb-2 font-semibold uppercase text-tertiary">
                                        Perfil de teste
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {menuProfiles.map(profile => (
                                            <button
                                                key={profile.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedProfileId(
                                                        profile.id,
                                                    )
                                                }
                                                className={clsx(
                                                    'px-3 py-1.5 text-xs border rounded-xs border-tertiary hover:bg-tertiary/20',
                                                    {
                                                        'bg-tertiary/20':
                                                            selectedProfileId ===
                                                            profile.id,
                                                    },
                                                )}
                                            >
                                                {profile.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <SidebarMenuContent
                            profile={currentProfile}
                            isLoggedIn={isLoggedIn}
                            onLogout={() => {
                                logout();
                                showInfoToast('Você saiu da sua conta.');
                                closeMenu();
                            }}
                            onNavigate={closeMenu}
                        />
                    </aside>
                    <Overlay isOpen={isMenuOpen} onClickBlur={setIsMenuOpen} />
                </div>
            </nav>
        </>
    );
};

export default NavigationMenu;
