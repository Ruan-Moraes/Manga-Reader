import { Home, Search, BookOpen, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MobileTabBar as DSMobileTabBar } from '@ui/MobileTabBar';

export interface LayoutMobileTabBarProps {
    activeKey: string;
    onNavigate: (path: string) => void;
}

export const MobileTabBar = ({
    activeKey,
    onNavigate,
}: LayoutMobileTabBarProps) => {
    const { t } = useTranslation('layout');

    return (
        <DSMobileTabBar
            activeKey={activeKey}
            items={[
                {
                    key: 'home',
                    label: t('nav.mobile.home'),
                    icon: Home,
                    onClick: () => onNavigate('/'),
                },
                {
                    key: 'search',
                    label: t('nav.mobile.search'),
                    icon: Search,
                    onClick: () => onNavigate('/search'),
                },
                {
                    key: 'library',
                    label: t('nav.mobile.library'),
                    icon: BookOpen,
                    onClick: () => onNavigate('/library'),
                },
                {
                    key: 'profile',
                    label: t('nav.mobile.profile'),
                    icon: User,
                    onClick: () => onNavigate('/profile'),
                },
            ]}
        />
    );
};

export default MobileTabBar;
