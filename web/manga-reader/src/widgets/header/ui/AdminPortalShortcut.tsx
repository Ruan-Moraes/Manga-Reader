import { LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import { Tooltip } from '@ui/Tooltip';

type AdminPortalShortcutProps = {
    visible: boolean;
    onNavigate: (path: string) => void;
};

const AdminPortalShortcut = ({ visible, onNavigate }: AdminPortalShortcutProps) => {
    const { t } = useTranslation('layout');
    const label = t('sidebar.menu.dashboard');

    if (!visible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-mr-mobile-tab hidden md:flex">
            <Tooltip content={label} side="left">
                <button
                    type="button"
                    aria-label={label}
                    onClick={() => onNavigate(ROUTES.DASHBOARD)}
                    className="mr-focus-ring flex size-12 items-center justify-center rounded-full border border-mr-accent-border bg-mr-accent text-mr-on-accent shadow-mr-black transition-[opacity,transform] hover:opacity-90 active:scale-95"
                >
                    <LayoutDashboard size={21} aria-hidden="true" />
                </button>
            </Tooltip>
        </div>
    );
};

export default AdminPortalShortcut;
