import { View } from 'react-native';

import { ListRow } from '@/shared/ui';

import type { SettingsIndexItem } from '../model/types';

interface SettingsIndexProps {
    items: readonly SettingsIndexItem[];
    /** Hint for a row's destination, built from the row title (revisão 2026-11-13). */
    openHint: (title: string) => string;
    loginRequiredLabel: string;
}

export function SettingsIndex({ items, openHint, loginRequiredLabel }: SettingsIndexProps) {
    return (
        <View accessibilityRole="list">
            {items.map((item, index) => (
                <ListRow
                    key={item.id}
                    accessibilityHint={item.loginRequired ? loginRequiredLabel : openHint(item.title)}
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
