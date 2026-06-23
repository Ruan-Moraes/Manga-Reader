export interface LayoutNavBarUser {
    name: string;
    avatar?: string;
    libraryCount?: number | null;
    unreadNews?: number;
}

export interface LayoutNavBarProps {
    user: LayoutNavBarUser | null;
    activeKey?: string;
    onNavigate: (path: string) => void;
    onOpenSideMenu: () => void;
    onSearchSubmit?: (query: string) => void;
    onNotificationsClick?: () => void;
    onLibraryClick?: () => void;
    onProfileClick?: () => void;
    onSettingsClick?: () => void;
    onLogoutClick?: () => void;
    onAccountClick?: () => void;
}
