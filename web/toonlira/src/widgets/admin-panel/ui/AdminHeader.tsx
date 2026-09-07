import { useTranslation } from 'react-i18next';

import { Menu } from 'lucide-react';

import { Avatar } from '@ui/Avatar';
import Logo from '@ui/Logo.tsx';

import { useAuth } from '@features/auth';

type AdminHeaderProps = {
    onToggleSidebar: () => void;
};

const AdminHeader = ({ onToggleSidebar }: AdminHeaderProps) => {
    const { user } = useAuth();

    const { t } = useTranslation('admin');

    return (
        <header className="flex h-14 shrink-0 items-center gap-3 border-b-2 border-ui-tertiary bg-ui-primary px-3.5 md:h-[60px] md:px-6">
            <button
                type="button"
                onClick={onToggleSidebar}
                className="flex size-10 shrink-0 items-center justify-center rounded-ui-xs border border-transparent text-ui-fg transition-colors hover:border-ui-border hover:bg-ui-accent-25 lg:hidden"
                aria-label={t('sidebar.openMenu')}
            >
                <Menu size={22} />
            </button>
            <Logo />
            <div className="flex-1" />
            {user && (
                <div className="flex items-center gap-2.5">
                    <span className="hidden flex-col items-end leading-tight md:flex">
                        <span className="text-ui-small font-ui-bold whitespace-nowrap text-ui-fg">{user.name}</span>
                        <span className="font-ui-mono text-[10px] tracking-normal text-ui-fg-subtle">#{user.id}</span>
                    </span>
                    <Avatar src={user.photo} name={user.name} size={36} />
                </div>
            )}
        </header>
    );
};

export default AdminHeader;
