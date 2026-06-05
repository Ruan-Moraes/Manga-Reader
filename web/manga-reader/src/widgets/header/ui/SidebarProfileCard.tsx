import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { ROUTES } from '@shared/constant/ROUTES';
import type { MenuProfile } from './SidebarMenuContent';

const sectionTitleClass = 'text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-quaternary-default';

type Props = {
    profile: MenuProfile;
    isLoggedIn: boolean;
    onNavigate: () => void;
};

const SidebarProfileCard = ({ profile, isLoggedIn, onNavigate }: Props) => {
    const { t } = useTranslation('layout');

    return (
        <div className="flex flex-col gap-2 p-3 border rounded-xs border-tertiary bg-secondary/40">
            {isLoggedIn ? (
                <>
                    <p className={sectionTitleClass}>{t('sidebar.section.account')}</p>
                    <p className="text-sm font-semibold">{profile.fullName}</p>
                    <p className="text-xs text-tertiary">{profile.email?.replace(/(.{4}).*(@.*)/, '$1••••$2')}</p>
                    {profile.planBadge && <p className="text-xs font-semibold text-quaternary-default">{profile.planBadge}</p>}
                </>
            ) : (
                <>
                    <p className={sectionTitleClass}>{t('sidebar.section.welcome')}</p>
                    <p className="text-sm font-semibold">{t('sidebar.welcomeMessage')}</p>
                    <div className="flex gap-2 pt-1">
                        <Link
                            to={`${WEB_BASE_URL}${ROUTES.LOGIN}`}
                            onClick={onNavigate}
                            className="px-3 py-2 text-xs font-semibold border rounded-xs border-tertiary hover:bg-secondary"
                        >
                            {t('sidebar.loginCta')}
                        </Link>
                        <Link
                            to={`${WEB_BASE_URL}${ROUTES.SIGN_UP}`}
                            onClick={onNavigate}
                            className="px-3 py-2 text-xs font-semibold border rounded-xs border-tertiary hover:bg-secondary"
                        >
                            {t('sidebar.signUpCta')}
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
};

export default SidebarProfileCard;
