import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';

import type { AppModuleDescriptor } from '../model/modules';

const MODULE_CARD_MIN_HEIGHT = 88;
const STATUS_DOT_SIZE = 6;

interface AppModuleCardProps {
    module: AppModuleDescriptor;
    title: string;
    description: string;
    availabilityLabel: string;
    actionLabel: string;
    onPress: () => void;
}

export function AppModuleCard({ module, title, description, availabilityLabel, actionLabel, onPress }: AppModuleCardProps) {
    const { metrics, radii, spacing, tokens } = useTheme();

    const [focused, setFocused] = useState(false);
    const [pressed, setPressed] = useState(false);

    const statusColor = module.availability === 'local-first' ? tokens.accentText : tokens.warn;

    return (
        <Pressable
            testID={`module-card-${module.id}`}
            accessibilityHint={description}
            accessibilityLabel={`${title}. ${availabilityLabel}. ${actionLabel}`}
            accessibilityRole="button"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onPress={onPress}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            style={{
                alignItems: 'center',
                backgroundColor: pressed ? tokens.surfacePressed : tokens.surface,
                borderColor: focused ? tokens.focus : tokens.separator,
                borderRadius: radii.card,
                borderWidth: 1,
                flexDirection: 'row',
                gap: spacing.md,
                minHeight: MODULE_CARD_MIN_HEIGHT,
                padding: spacing.md,
                ...(pressed ? { transform: [{ scale: 0.99 }] } : {}),
            }}
        >
            <View
                testID={`module-card-tile-${module.id}`}
                style={{
                    alignItems: 'center',
                    backgroundColor: tokens.accentSoft,
                    borderRadius: radii.control,
                    height: metrics.iconTile.feature,
                    justifyContent: 'center',
                    width: metrics.iconTile.feature,
                }}
            >
                <Icon name={module.icon} size={metrics.icon.lg} color={tokens.accentText} decorative />
            </View>
            <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                <AppText variant="section">{title}</AppText>
                <AppText variant="caption" tone="muted">
                    {description}
                </AppText>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
                    <View
                        testID={`module-card-status-dot-${module.id}`}
                        style={{ backgroundColor: statusColor, borderRadius: radii.pill, height: STATUS_DOT_SIZE, width: STATUS_DOT_SIZE }}
                    />
                    <AppText variant="caption" style={{ color: statusColor }}>
                        {availabilityLabel}
                    </AppText>
                </View>
            </View>
            <Icon name="chevron-forward" size={metrics.icon.md} color={tokens.muted} decorative />
        </Pressable>
    );
}
