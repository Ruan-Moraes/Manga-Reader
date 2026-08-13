import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FONTS, useTheme } from '@/src/shared/theme';

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
    const { minimumTouchTarget, radii, spacing, tokens, typography } = useTheme();

    return (
        <TouchableOpacity
            accessibilityHint={description}
            accessibilityLabel={`${title}. ${availabilityLabel}. ${actionLabel}`}
            accessibilityRole="button"
            activeOpacity={0.86}
            onPress={onPress}
            style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.accentBorder,
                borderRadius: radii.feature,
                borderWidth: 1,
                gap: spacing.md,
                minHeight: minimumTouchTarget * 3,
                padding: spacing.lg,
            }}
        >
            <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' }}>
                <View
                    style={{
                        alignItems: 'center',
                        backgroundColor: tokens.accentSoft,
                        borderRadius: radii.control,
                        height: minimumTouchTarget,
                        justifyContent: 'center',
                        width: minimumTouchTarget,
                    }}
                >
                    <Ionicons name={module.icon} size={24} color={tokens.accentText} />
                </View>
                <View style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}>
                    <Text style={{ color: tokens.accentText, fontFamily: FONTS.bold, fontSize: typography.minimum }}>{availabilityLabel}</Text>
                </View>
            </View>
            <View style={{ gap: spacing.xs }}>
                <Text style={{ color: tokens.text, fontFamily: FONTS.bold, fontSize: typography.h2 }}>{title}</Text>
                <Text style={{ color: tokens.muted, fontFamily: FONTS.regular, fontSize: typography.body, lineHeight: typography.body * 1.45 }}>
                    {description}
                </Text>
            </View>
            <Text style={{ color: tokens.accentText, fontFamily: FONTS.extrabold, fontSize: typography.small }}>{actionLabel} →</Text>
        </TouchableOpacity>
    );
}
