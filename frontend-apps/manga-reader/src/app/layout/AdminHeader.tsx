import { useTranslation } from 'react-i18next';

import { FiMenu } from 'react-icons/fi';

import UserAvatar from '@shared/component/avatar/UserAvatar';
import Logo from '@shared/component/logo/Logo.tsx';

import { useAuth } from '@feature/auth';

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
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="rounded-xs md:hidden hover:bg-tertiary/30"
                        aria-label={t('sidebar.openMenu')}
                    >
                        <FiMenu size={26} />
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
                    <UserAvatar
                        src={user.photo}
                        name={user.name}
                        size="md"
                        rounded="xs"
                        className="border border-tertiary"
                    />
                </div>
            )}
        </header>
    );
};

export default AdminHeader;
