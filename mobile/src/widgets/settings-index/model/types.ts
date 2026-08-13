export interface SettingsIndexItem {
    id: string;
    title: string;
    description: string;
    statusLabel: string;
    loginRequired: boolean;
    onPress: () => void;
}
