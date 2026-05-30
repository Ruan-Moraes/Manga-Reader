import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Users, Book, FileText, Calendar, Tag, Layers, DollarSign, CreditCard, X } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';

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

const BASE = `${WEB_BASE_URL}${ROUTES.DASHBOARD}`;

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
                to: `${BASE}/tags`,
                labelKey: 'sidebar.tags',
                icon: <Tag size={18} />,
            },
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
            {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} aria-hidden="true" />}
            <aside
                aria-label={t('sidebar.brand')}
                className={`
                    fixed top-0 left-0 z-50 flex flex-col w-64 h-full p-3 border-r bg-secondary border-r-tertiary
                    transition-transform duration-200 ease-in-out overflow-y-auto
                    md:static md:translate-x-0 md:h-full md:shrink-0 md:w-56
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex items-center justify-between mb-3 md:hidden">
                    <span className="text-sm font-semibold">{t('sidebar.brand')}</span>
                    <button type="button" onClick={onClose} aria-label={t('sidebar.closeMenu')} className="p-1 rounded-xs hover:bg-tertiary/30">
                        <X size={20} />
                    </button>
                </div>
                <nav className="flex flex-col gap-4">
                    {SECTIONS.map(section => (
                        <div key={section.titleKey} className="flex flex-col gap-1">
                            <span className="text-xs font-semibold tracking-wider uppercase text-quaternary">{t(section.titleKey)}</span>
                            {section.items.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-3 py-2 text-sm rounded-xs transition-colors ${
                                            isActive ? 'bg-quaternary-opacity-25 font-semibold' : 'hover:bg-tertiary/30'
                                        }`
                                    }
                                >
                                    {item.icon}
                                    <span>{t(item.labelKey)}</span>
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
