import { View } from 'react-native';

import { ListRow } from '@/shared/ui';

import type { SettingsIndexItem } from '../model/types';

interface SettingsIndexProps {
    items: readonly SettingsIndexItem[];
    openHint: string;
    loginRequiredLabel: string;
}

export function SettingsIndex({ items, openHint, loginRequiredLabel }: SettingsIndexProps) {
    return (
        <View accessibilityRole="list">
            {items.map((item, index) => (
                <ListRow
                    key={item.id}
                    accessibilityHint={item.loginRequired ? loginRequiredLabel : openHint}
                    accessibilityLabel={item.statusLabel ? `${item.title}. ${item.statusLabel}` : item.title}
                    description={item.description}
                    icon={item.icon}
                    meta={item.loginRequired ? loginRequiredLabel : item.statusLabel}
                    metaPlacement="supporting"
                    onPress={item.onPress}
                    showDivider={index < items.length - 1}
                    statusTone={item.loginRequired ? 'warning' : (item.statusTone ?? 'neutral')}
                    title={item.title}
                    variant="plain"
                />
            ))}
        </View>
    );
}
