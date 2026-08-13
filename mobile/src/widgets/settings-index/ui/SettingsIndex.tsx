import { View } from 'react-native';

import { useTheme } from '@/src/shared/theme';
import { ListRow } from '@/src/shared/ui';

import type { SettingsIndexItem } from '../model/types';

interface SettingsIndexProps {
    items: readonly SettingsIndexItem[];
    openHint: string;
    loginRequiredLabel: string;
}

export function SettingsIndex({ items, openHint, loginRequiredLabel }: SettingsIndexProps) {
    const { spacing } = useTheme();

    return (
        <View accessibilityRole="list" style={{ gap: spacing.md }}>
            {items.map(item => (
                <ListRow
                    key={item.id}
                    accessibilityHint={item.loginRequired ? loginRequiredLabel : openHint}
                    accessibilityLabel={`${item.title}. ${item.statusLabel}`}
                    description={item.description}
                    meta={item.loginRequired ? loginRequiredLabel : item.statusLabel}
                    onPress={item.onPress}
                    title={item.title}
                />
            ))}
        </View>
    );
}
