import { Link } from 'react-router-dom';

import { clsx } from 'clsx';

import { clearCache } from '@shared/service/util/queryCache';

// TODO: Refatorar para usar o AppLink e evitar duplicação de código, além de garantir consistência visual e funcional em toda a aplicação.

export type MenuProfile = {
    id: string;
    label: string;
    fullName?: string;
    email?: string;
    planBadge?: string;
    savedCount?: number;
    unreadNotifications?: number;
    newsBadge?: string;
    eventBadge?: string;
    canDownload?: boolean;
    isAdmin?: boolean;
    isVisitor?: boolean;
};

type MenuLinkBlockProps = {
    profile: MenuProfile;
    isLoggedIn: boolean;
    onLogout: () => void;
    onNavigate: () => void;
};

type MenuItem = {
    label: string;
    link: string;
    badge?: string;
};

const sectionTitleClass =
    'text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-quaternary-default';

const menuItemClass =
    'flex items-center justify-between px-3 py-2 rounded-xs text-sm font-medium transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quaternary-default';

const MenuNavLink = ({
    label,
    link,
    badge,
    onNavigate,
}: MenuItem & { onNavigate: () => void }) => {
    return (
        <Link
            to={`/Manga-Reader${link}`}
            className={menuItemClass}
            onClick={onNavigate}
        >
            <span>{label}</span>
            {badge && (
                <span className="px-2 py-0.5 text-[0.68rem] font-semibold rounded-xs bg-secondary border border-tertiary text-tertiary">
                    {badge}
                </span>
            )}
        </Link>
    );
};

const SidebarMenuContent = ({
    profile,
    isLoggedIn,
    onLogout,
    onNavigate,
}: MenuLinkBlockProps) => {
    const feedItems: MenuItem[] = [
        { label: 'Home', link: '/' },
        {
            label: 'Trending',
            link: '/categories?sort=trending',
            badge: 'em alta',
        },
        { label: 'Novidades', link: '/news?filter=new' },
    ];

    const libraryItems: MenuItem[] = [
        {
            label: 'Meus Mangás',
            link: '/saved-mangas',
            badge: `${profile.savedCount ?? 0} salvos`,
        },
        { label: 'Avaliados', link: '/reviews' },
        ...(profile.canDownload
            ? [{ label: 'Downloads', link: '/library?tab=downloads' }]
            : []),
    ];

    const communityItems: MenuItem[] = [
        { label: 'Notícias', link: '/news', badge: profile.newsBadge ?? '+0' },
        {
            label: 'Eventos',
            link: '/events',
            badge: profile.eventBadge ?? 'sem próximos',
        },
        { label: 'Grupos de Tradução', link: '/groups' },
        { label: 'Fórum / Discussões', link: '/forum' },
    ];

    const settingsItems: MenuItem[] = [
        { label: 'Meu Perfil', link: '/profile' },
        {
            label: 'Notificações',
            link: '/profile?tab=notifications',
            badge: `+${profile.unreadNotifications ?? 0}`,
        },
        { label: 'Aparência', link: '/profile?tab=appearance' },
        { label: 'Modo Leitura', link: '/profile?tab=reading' },
        { label: 'Privacidade', link: '/profile?tab=privacy' },
    ];

    const adminItems: MenuItem[] = [
        { label: 'Dashboard', link: '/profile?tab=dashboard' },
        { label: 'Gerenciar Notícias', link: '/news?tab=manage' },
        { label: 'Gerenciar Eventos', link: '/events?tab=manage' },
        { label: 'Gerenciar Grupos', link: '/groups?tab=manage' },
        { label: 'Gerenciar Usuários', link: '/profile?tab=users' },
        { label: 'Configurações do Site', link: '/profile?tab=site' },
    ];

    return (
        <div className="flex flex-col h-full gap-4 px-4 pb-4 overflow-y-auto">
            <div className="flex flex-col gap-2 p-3 border rounded-xs border-tertiary bg-secondary/40">
                {isLoggedIn && !profile.isVisitor ? (
                    <>
                        <p className={sectionTitleClass}>Conta</p>
                        <p className="text-sm font-semibold">
                            {profile.fullName}
                        </p>
                        <p className="text-xs text-tertiary">
                            {profile.email?.replace(
                                /(.{4}).*(@.*)/,
                                '$1••••$2',
                            )}
                        </p>
                        {profile.planBadge && (
                            <p className="text-xs font-semibold text-quaternary-default">
                                {profile.planBadge}
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        <p className={sectionTitleClass}>Bem-vindo</p>
                        <p className="text-sm font-semibold">
                            Faça parte da comunidade
                        </p>
                        <div className="flex gap-2 pt-1">
                            <Link
                                to="/Manga-Reader/login"
                                onClick={onNavigate}
                                className="px-3 py-2 text-xs font-semibold border rounded-xs border-tertiary hover:bg-secondary"
                            >
                                Entrar
                            </Link>
                            <Link
                                to="/Manga-Reader/sign-up"
                                onClick={onNavigate}
                                className="px-3 py-2 text-xs font-semibold border rounded-xs border-tertiary hover:bg-secondary"
                            >
                                Cadastrar
                            </Link>
                        </div>
                    </>
                )}
            </div>

            <section className="flex flex-col gap-1.5">
                <h3 className={sectionTitleClass}>Feed</h3>
                {feedItems.map(item => (
                    <MenuNavLink
                        key={item.label}
                        {...item}
                        onNavigate={onNavigate}
                    />
                ))}
            </section>

            {isLoggedIn && !profile.isVisitor && (
                <section className="flex flex-col gap-1.5">
                    <h3 className={sectionTitleClass}>Biblioteca</h3>
                    {libraryItems.map(item => (
                        <MenuNavLink
                            key={item.label}
                            {...item}
                            onNavigate={onNavigate}
                        />
                    ))}
                </section>
            )}

            <section className="flex flex-col gap-1.5">
                <h3 className={sectionTitleClass}>Comunidade</h3>
                {communityItems.map(item => (
                    <MenuNavLink
                        key={item.label}
                        {...item}
                        onNavigate={onNavigate}
                    />
                ))}
            </section>

            {isLoggedIn && !profile.isVisitor && (
                <section className="flex flex-col gap-1.5">
                    <h3 className={sectionTitleClass}>Configurações</h3>
                    {settingsItems.map(item => (
                        <MenuNavLink
                            key={item.label}
                            {...item}
                            onNavigate={onNavigate}
                        />
                    ))}
                </section>
            )}

            {profile.isAdmin && (
                <section className="flex flex-col gap-1.5">
                    <h3 className={sectionTitleClass}>Admin</h3>
                    {adminItems.map(item => (
                        <MenuNavLink
                            key={item.label}
                            {...item}
                            onNavigate={onNavigate}
                        />
                    ))}
                </section>
            )}

            <div className="flex items-center w-full gap-2 pt-2 mt-auto border-t border-tertiary/50">
                <button
                    onClick={clearCache}
                    className="h-10 px-4 text-xs font-semibold border rounded-xs border-tertiary bg-secondary hover:bg-tertiary/20"
                >
                    Limpar cache
                </button>
                {isLoggedIn && !profile.isVisitor && (
                    <button
                        onClick={onLogout}
                        className={clsx(
                            'h-10 px-4 text-xs font-semibold border rounded-xs border-tertiary bg-secondary hover:bg-tertiary/20',
                        )}
                    >
                        Sair
                    </button>
                )}
            </div>
        </div>
    );
};

export default SidebarMenuContent;
