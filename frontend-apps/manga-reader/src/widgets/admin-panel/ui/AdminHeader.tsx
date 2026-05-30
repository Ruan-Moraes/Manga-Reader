import { useTranslation } from 'react-i18next';

import { Menu } from 'lucide-react';

import { Avatar } from '@ui/Avatar';
import Logo from '@shared/component/logo/admin/Logo.tsx';

import { useAuth } from '@features/auth';

type AdminHeaderProps = {
    onToggleSidebar: () => void;
};

const AdminHeader = ({ onToggleSidebar }: AdminHeaderProps) => {
    const { user } = useAuth();

    const { t } = useTranslation('admin');

    return (
        <header className="flex items-center justify-between px-3 py-2 border-b bg-secondary border-b-tertiary">
            <div>
                <div className="flex items-center">
                    <button type="button" onClick={onToggleSidebar} className="rounded-xs md:hidden hover:bg-tertiary/30" aria-label={t('sidebar.openMenu')}>
                        <Menu size={26} />
                    </button>
                </div>
                <div className="hidden md:block">
                    <Logo />
                </div>
            </div>
            {user && (
                <div className="flex items-center gap-2">
                    <span className="text-sm flex flex-col items-end">
                        <span className="font-bold">{user.name}</span>
                        <span className="text-[0.625rem]">({user.id})</span>
                    </span>
                    <Avatar src={user.photo} name={user.name} size={40} />
                </div>
            )}
        </header>
    );
};

export default AdminHeader;
