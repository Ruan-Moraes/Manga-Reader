import { NavLink } from 'react-router-dom';
import {
    FiHome,
    FiUsers,
    FiBook,
    FiFileText,
    FiCalendar,
    FiTag,
    FiLayers,
    FiDollarSign,
} from 'react-icons/fi';

type SidebarLink = {
    to: string;
    label: string;
    icon: React.ReactNode;
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
];

const AdminSidebar = () => {
    return (
        <aside className="flex flex-col w-56 min-h-screen gap-1 p-3 border-r shrink-0 bg-secondary border-r-tertiary">
            <h2 className="px-2 mb-3 text-sm font-bold tracking-wide uppercase text-tertiary">
                Admin
            </h2>
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
    );
};

export default AdminSidebar;
