import type { IconName } from '@/src/shared/ui';

export interface SettingsIndexItem {
    id: string;
    title: string;
    description: string;
    statusLabel?: string;
    loginRequired: boolean;
    icon?: IconName;
    statusTone?: 'danger' | 'neutral' | 'success' | 'warning';
    onPress: () => void;
}
