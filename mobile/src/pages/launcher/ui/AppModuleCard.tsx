import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';

import type { AppModuleDescriptor } from '../model/modules';

interface AppModuleCardProps {
    module: AppModuleDescriptor;
    title: string;
    description: string;
    availabilityLabel: string;
    actionLabel: string;
    onPress: () => void;
}

export function AppModuleCard({ module, title, description, availabilityLabel, actionLabel, onPress }: AppModuleCardProps) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [focused, setFocused] = useState(false);
    const [pressed, setPressed] = useState(false);

    return (
        <Pressable
            accessibilityHint={description}
            accessibilityLabel={`${title}. ${availabilityLabel}. ${actionLabel}`}
            accessibilityRole="button"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onPress={onPress}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            style={{
                backgroundColor: pressed ? tokens.surfacePressed : tokens.surface,
                borderColor: focused ? tokens.focus : tokens.separator,
                borderRadius: radii.card,
                borderWidth: focused ? 2 : 0,
                minHeight: 78,
                padding: spacing.md,
                shadowColor: tokens.overlay,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.05,
                shadowRadius: 16,
                elevation: 1,
                ...(pressed ? { transform: [{ scale: 0.99 }] } : {}),
            }}
        >
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
                <View
                    style={{
                        alignItems: 'center',
                        backgroundColor: tokens.accentSoft,
                        borderRadius: radii.sm,
                        height: minimumTouchTarget,
                        justifyContent: 'center',
                        width: minimumTouchTarget,
                    }}
                >
                    <Icon name={module.icon} size={22} color={tokens.accentText} />
                </View>
                <View style={{ flex: 1, gap: spacing.xs }}>
                    <AppText variant="section">{title}</AppText>
                    <AppText variant="caption" tone="muted">
                        {description}
                    </AppText>
                </View>
                <Icon name="chevron-forward" size={18} color={tokens.muted} />
            </View>
        </Pressable>
    );
}
