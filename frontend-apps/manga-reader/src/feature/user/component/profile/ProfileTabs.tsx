import { useTranslation } from 'react-i18next';

type Tab = {
    id: string;
    i18nKey: string;
    visible: boolean;
};

type Props = {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isOwner: boolean;
    hasComments: boolean;
    hasHistory: boolean;
};

const ProfileTabs = ({
    activeTab,
    onTabChange,
    isOwner,
    hasComments,
    hasHistory,
}: Props) => {
    const { t } = useTranslation('user');

    const tabs: Tab[] = [
        { id: 'about', i18nKey: 'about', visible: true },
        { id: 'recommendations', i18nKey: 'recommendations', visible: true },
        {
            id: 'comments',
            i18nKey: 'comments',
            visible: hasComments || isOwner,
        },
        {
            id: 'history',
            i18nKey: 'history',
            visible: hasHistory || isOwner,
        },
        { id: 'settings', i18nKey: 'settings', visible: isOwner },
    ];

    return (
        <div className="flex gap-1 px-4 overflow-x-auto border-b border-tertiary">
            {tabs
                .filter(tab => tab.visible)
                .map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                            activeTab === tab.id
                                ? 'border-quaternary text-quaternary'
                                : 'border-transparent text-tertiary hover:text-primary-default'
                        }`}
                    >
                        {t(`profile.tabs.${tab.i18nKey}`)}
                    </button>
                ))}
        </div>
    );
};

export default ProfileTabs;
