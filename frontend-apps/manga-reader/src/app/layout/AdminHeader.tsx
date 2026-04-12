import AppLink from '@shared/component/link/element/AppLink';
import UserAvatar from '@shared/component/avatar/UserAvatar';

import { useAuth } from '@feature/auth';

import { FiArrowLeft, FiMenu } from 'react-icons/fi';

type AdminHeaderProps = {
    onToggleSidebar: () => void;
};

const AdminHeader = ({ onToggleSidebar }: AdminHeaderProps) => {
    const { user } = useAuth();

    return (
        <header className="flex items-center justify-between px-4 py-2 border-b bg-secondary border-b-tertiary">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="p-1 rounded-xs md:hidden hover:bg-tertiary/30"
                    aria-label="Abrir menu"
                >
                    <FiMenu size={20} />
                </button>
                <span className="hidden sm:block text-sm font-semibold">
                    Painel Admin
                </span>
            </div>
            {user && (
                <div className="flex items-center gap-2">
                    <span className="hidden text-sm sm:inline">
                        {user.name}
                    </span>
                    <UserAvatar
                        src={user.photo}
                        name={user.name}
                        size="sm"
                        rounded="xs"
                        className="border border-tertiary"
                    />
                </div>
            )}
        </header>
    );
};

export default AdminHeader;
