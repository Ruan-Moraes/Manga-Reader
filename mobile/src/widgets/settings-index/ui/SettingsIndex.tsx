import { View } from 'react-native';

import { useTheme } from '@/src/shared/theme';
import { Icon, ListRow } from '@/src/shared/ui';

import type { SettingsIndexItem } from '../model/types';

interface SettingsIndexProps {
    items: readonly SettingsIndexItem[];
    openHint: string;
    loginRequiredLabel: string;
}

export function SettingsIndex({ items, openHint, loginRequiredLabel }: SettingsIndexProps) {
    const { radii, tokens } = useTheme();

    return (
        <View accessibilityRole="list">
            {items.map((item, index) => (
                <ListRow
                    key={item.id}
                    accessibilityHint={item.loginRequired ? loginRequiredLabel : openHint}
                    accessibilityLabel={`${item.title}. ${item.statusLabel}`}
                    description={item.description}
                    leading={
                        item.icon ? (
                            <View
                                accessibilityElementsHidden
                                style={{
                                    alignItems: 'center',
                                    backgroundColor: tokens.accentSoft,
                                    borderRadius: radii.control,
                                    height: 42,
                                    justifyContent: 'center',
                                    width: 42,
                                }}
                            >
                                <Icon name={item.icon} size={21} decorative />
                            </View>
                        ) : undefined
                    }
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
