import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Users, Book, BookOpen, FileText, Calendar, Tag, Layers, DollarSign, CreditCard, PenTool, Building2, Store, X } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import { withWebBasePath } from '@shared/constant/WEB_BASE_URL';

type AdminSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
};

type NavItem = {
    to: string;
    labelKey: string;
    icon: React.ReactNode;
    end?: boolean;
};

type NavSection = {
    titleKey: string;
    items: NavItem[];
};

const BASE = withWebBasePath(ROUTES.DASHBOARD);

const SECTIONS: NavSection[] = [
    {
        titleKey: 'sidebar.sectionGeneral',
        items: [
            {
                to: BASE,
                labelKey: 'sidebar.overview',
                icon: <Home size={18} />,
                end: true,
            },
        ],
    },
    {
        titleKey: 'sidebar.sectionContent',
        items: [
            {
                to: `${BASE}/titles`,
                labelKey: 'sidebar.titles',
                icon: <Book size={18} />,
            },
            {
                to: `${BASE}/chapters`,
                labelKey: 'sidebar.chapters',
                icon: <BookOpen size={18} />,
            },
            {
                to: `${BASE}/tags`,
                labelKey: 'sidebar.tags',
                icon: <Tag size={18} />,
            },
            {
                to: `${BASE}/authors`,
                labelKey: 'sidebar.authors',
                icon: <PenTool size={18} />,
            },
            {
                to: `${BASE}/publishers`,
                labelKey: 'sidebar.publishers',
                icon: <Building2 size={18} />,
            },
            { to: `${BASE}/stores`, labelKey: 'sidebar.stores', icon: <Store size={18} /> },
            {
                to: `${BASE}/news`,
                labelKey: 'sidebar.news',
                icon: <FileText size={18} />,
            },
            {
                to: `${BASE}/events`,
                labelKey: 'sidebar.events',
                icon: <Calendar size={18} />,
            },
        ],
    },
    {
        titleKey: 'sidebar.sectionCommunity',
        items: [
            {
                to: `${BASE}/users`,
                labelKey: 'sidebar.users',
                icon: <Users size={18} />,
            },
            {
                to: `${BASE}/groups`,
                labelKey: 'sidebar.groups',
                icon: <Layers size={18} />,
            },
        ],
    },
    {
        titleKey: 'sidebar.sectionMonetization',
        items: [
            {
                to: `${BASE}/financial`,
                labelKey: 'sidebar.financial',
                icon: <DollarSign size={18} />,
            },
            {
                to: `${BASE}/subscriptions`,
                labelKey: 'sidebar.subscriptions',
                icon: <CreditCard size={18} />,
            },
        ],
    },
];

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
    const { t } = useTranslation('admin');

    const location = useLocation();

    const prevPathRef = useRef(location.pathname);

    useEffect(() => {
        if (prevPathRef.current !== location.pathname) {
            prevPathRef.current = location.pathname;
            onClose();
        }
    }, [location.pathname, onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', onKey);

        const prev = document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [isOpen, onClose]);

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-ui-mobile-tab bg-ui-overlay backdrop-blur-mr lg:hidden" onClick={onClose} aria-hidden="true" />
            )}
            <aside
                aria-label={t('sidebar.brand')}
                className={`
                    fixed top-0 left-0 z-ui-header flex flex-col w-[248px] h-full px-2.5 py-3 border-r bg-ui-primary border-ui-border
                    transition-transform duration-200 ease-in-out overflow-y-auto
                    lg:static lg:translate-x-0 lg:h-full lg:shrink-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex items-center justify-between mb-3 px-1 lg:hidden">
                    <span className="text-ui-h4 font-ui-extrabold italic text-ui-fg">
                        Manga <b className="font-ui-extrabold text-ui-accent-fg">Reader</b>
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('sidebar.closeMenu')}
                        className="flex size-9 items-center justify-center rounded-ui-xs border border-transparent text-ui-fg-muted transition-colors hover:border-ui-border hover:bg-ui-accent-25 hover:text-ui-accent-fg"
                    >
                        <X size={20} />
                    </button>
                </div>
                <nav className="flex flex-col gap-4">
                    {SECTIONS.map(section => (
                        <div key={section.titleKey} className="flex flex-col gap-1">
                            <span className="px-2.5 pb-2 text-ui-tiny font-ui-extrabold uppercase tracking-[0.12em] text-ui-fg-subtle">
                                {t(section.titleKey)}
                            </span>
                            {section.items.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `relative flex min-h-10 items-center gap-3 rounded-ui-xs border px-2.5 py-2.5 text-ui-body transition-colors ${
                                            isActive
                                                ? 'border-ui-accent-50 bg-ui-accent-25 font-ui-bold text-ui-accent-fg'
                                                : 'border-transparent font-ui-semibold text-ui-fg-muted hover:bg-ui-surface hover:text-ui-fg'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <span aria-hidden="true" className="absolute left-[-10px] top-2 bottom-2 w-[3px] rounded-r-ui-xs bg-ui-accent" />
                                            )}
                                            <span className={isActive ? 'text-ui-accent-fg' : 'text-ui-tertiary'}>{item.icon}</span>
                                            <span>{t(item.labelKey)}</span>
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default AdminSidebar;
