import { useTranslation } from 'react-i18next';
import { Home, Settings } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { Tooltip } from '@ui/Tooltip';

/**
 * Atalhos flutuantes do painel admin (canto inferior direito): voltar ao site público e abrir as
 * configurações de idioma/interface. Ancorado ao container `#admin-content` (relative), fica
 * restrito à coluna de conteúdo e pinado ao rolar.
 */
const AdminFloatingActions = () => {
    const { t } = useTranslation('admin');
    const navigate = useAppNavigate();

    return (
        <div className="absolute bottom-5 right-5 z-40 flex flex-col gap-3 md:bottom-6 md:right-6">
            <Tooltip content={t('quickActions.settings')} side="left">
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.SETTINGS)}
                    aria-label={t('quickActions.settings')}
                    className="mr-focus-ring flex size-12 items-center justify-center rounded-full border border-mr-accent bg-mr-accent text-mr-primary shadow-mr-black transition-[opacity,transform] hover:opacity-90 active:scale-95"
                >
                    <Settings size={20} />
                </button>
            </Tooltip>
            <Tooltip content={t('quickActions.home')} side="left">
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.HOME)}
                    aria-label={t('quickActions.home')}
                    className="mr-focus-ring flex size-12 items-center justify-center rounded-full border border-mr-border bg-mr-surface text-mr-fg shadow-mr-black transition-colors hover:border-mr-accent hover:bg-mr-accent-25 hover:text-mr-accent active:scale-95"
                >
                    <Home size={20} />
                </button>
            </Tooltip>
        </div>
    );
};

export default AdminFloatingActions;
