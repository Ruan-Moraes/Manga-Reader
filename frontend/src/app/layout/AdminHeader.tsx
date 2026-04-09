import AppLink from '@shared/component/link/element/AppLink';
import UserAvatar from '@shared/component/avatar/UserAvatar';

import { useAuth } from '@feature/auth';

import { FiArrowLeft } from 'react-icons/fi';

const AdminHeader = () => {
    const { user } = useAuth();

    return (
        <header className="flex items-center justify-between px-4 py-2 border-b bg-secondary border-b-tertiary">
            <div className="flex items-center gap-3">
                <AppLink link="/" className="flex items-center gap-1 text-sm hover:text-quaternary-default">
                    <FiArrowLeft size={14} />
                    Voltar ao site
                </AppLink>
                <span className="text-tertiary">|</span>
                <span className="text-sm font-semibold">Painel Admin</span>
            </div>
            {user && (
                <div className="flex items-center gap-2">
                    <span className="text-sm">{user.name}</span>
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
