import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type ProfileSettingsTab = 'informacoes' | 'redes' | 'recomendacoes' | 'grupos' | 'privacidade';

type ProfileSettingsModalContextValue = {
    isOpen: boolean;
    activeTab: ProfileSettingsTab;
    /** Abre o modal de configurações do usuário, opcionalmente em uma aba específica. */
    openProfileSettings: (tab?: ProfileSettingsTab) => void;
    closeProfileSettings: () => void;
    setActiveTab: (tab: ProfileSettingsTab) => void;
};

const NOOP_CONTEXT: ProfileSettingsModalContextValue = {
    isOpen: false,
    activeTab: 'informacoes',
    openProfileSettings: () => {},
    closeProfileSettings: () => {},
    setActiveTab: () => {},
};

// Valor padrão é um no-op: o modal é montado uma única vez na árvore roteada,
// mas componentes que apenas disparam a abertura (Header, perfil) funcionam em
// testes isolados sem precisar do provider.
const ProfileSettingsModalContext = createContext<ProfileSettingsModalContextValue>(NOOP_CONTEXT);

const ProfileSettingsModalProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ProfileSettingsTab>('informacoes');

    const openProfileSettings = useCallback((tab: ProfileSettingsTab = 'informacoes') => {
        setActiveTab(tab);
        setIsOpen(true);
    }, []);

    const closeProfileSettings = useCallback(() => setIsOpen(false), []);

    const value = useMemo<ProfileSettingsModalContextValue>(
        () => ({ isOpen, activeTab, openProfileSettings, closeProfileSettings, setActiveTab }),
        [isOpen, activeTab, openProfileSettings, closeProfileSettings],
    );

    return <ProfileSettingsModalContext.Provider value={value}>{children}</ProfileSettingsModalContext.Provider>;
};

const useProfileSettingsModal = () => useContext(ProfileSettingsModalContext);

export { ProfileSettingsModalContext, ProfileSettingsModalProvider, useProfileSettingsModal };
