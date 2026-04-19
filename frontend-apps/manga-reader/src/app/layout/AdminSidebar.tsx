import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import {
    FiHome,
    FiUsers,
    FiBook,
    FiFileText,
    FiCalendar,
    FiTag,
    FiLayers,
    FiDollarSign,
    FiCreditCard,
} from 'react-icons/fi';

type SidebarLink = {
    to: string;
    label: string;
    icon: React.ReactNode;
};

type AdminSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
};

const links: SidebarLink[] = [
    {
        to: '/Manga-Reader/dashboard',
        label: 'Visão Geral',
        icon: <FiHome size={18} />,
    },
    {
        to: '/Manga-Reader/dashboard/users',
        label: 'Usuários',
        icon: <FiUsers size={18} />,
    },
    {
        to: '/Manga-Reader/dashboard/titles',
        label: 'Obras',
        icon: <FiBook size={18} />,
    },
    {
        to: '/Manga-Reader/dashboard/news',
        label: 'Notícias',
        icon: <FiFileText size={18} />,
    },
    {
        to: '/Manga-Reader/dashboard/events',
        label: 'Eventos',
        icon: <FiCalendar size={18} />,
    },
    {
        to: '/Manga-Reader/dashboard/tags',
        label: 'Tags',
        icon: <FiTag size={18} />,
    },
    {
        to: '/Manga-Reader/dashboard/groups',
        label: 'Grupos',
        icon: <FiLayers size={18} />,
    },
    {
        to: '/Manga-Reader/dashboard/financial',
        label: 'Financeiro',
        icon: <FiDollarSign size={18} />,
    },
    {
        to: '/Manga-Reader/dashboard/subscriptions',
        label: 'Assinaturas',
        icon: <FiCreditCard size={18} />,
    },
];

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
    const location = useLocation();

    useEffect(() => {
        onClose();
    }, [location.pathname, onClose]);

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`
                    fixed top-0 left-0 z-50 flex flex-col w-56 h-full gap-1 p-3 border-r bg-secondary border-r-tertiary
                    transition-transform duration-200 ease-in-out
                    md:static md:translate-x-0 md:min-h-screen md:shrink-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {links.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/Manga-Reader/dashboard'}
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 text-sm rounded-xs transition-colors ${
                                isActive
                                    ? 'bg-quaternary-opacity-25 font-semibold'
                                    : 'hover:bg-tertiary/30'
                            }`
                        }
                    >
                        {link.icon}
                        {link.label}
                    </NavLink>
                ))}
            </aside>
        </>
    );
};

export default AdminSidebar;
