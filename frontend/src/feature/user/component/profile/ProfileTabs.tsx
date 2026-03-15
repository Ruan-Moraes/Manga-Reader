type Tab = {
    id: string;
    label: string;
    visible: boolean;
};

type Props = {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isOwner: boolean;
    hasComments: boolean;
    hasHistory: boolean;
};

const ProfileTabs = ({ activeTab, onTabChange, isOwner, hasComments, hasHistory }: Props) => {
    const tabs: Tab[] = [
        { id: 'about', label: 'Sobre', visible: true },
        { id: 'recommendations', label: 'Recomendados', visible: true },
        { id: 'comments', label: 'Comentarios', visible: hasComments || isOwner },
        { id: 'history', label: 'Historico', visible: hasHistory || isOwner },
        { id: 'settings', label: 'Configuracoes', visible: isOwner },
    ];

    return (
        <div className="flex gap-1 px-4 overflow-x-auto border-b border-tertiary">
            {tabs
                .filter(t => t.visible)
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
                        {tab.label}
                    </button>
                ))}
        </div>
    );
};

export default ProfileTabs;
