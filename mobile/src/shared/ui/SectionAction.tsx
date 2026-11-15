import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type SectionActionTone = 'neutral' | 'accent' | 'strong';

interface SectionActionProps {
    label: string;
    onPress: () => void;
    icon?: IconName;
    tone?: SectionActionTone;
    accessibilityLabel?: string;
    disabled?: boolean;
    testID?: string;
}

/** 36-high chip inside a full touch target, used in section headers. */
export function SectionAction({ label, onPress, icon, tone = 'neutral', accessibilityLabel, disabled = false, testID }: SectionActionProps) {
    const { metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();

    const palette = {
        neutral: { background: tokens.surfaceMuted, color: tokens.muted, border: tokens.separator },
        accent: { background: tokens.accentSoft, color: tokens.accentText, border: 'transparent' },
        strong: { background: tokens.accent, color: tokens.onAccent, border: 'transparent' },
    }[tone];

    return (
        <Pressable
            testID={testID}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={{ justifyContent: 'center', minHeight: minimumTouchTarget, opacity: disabled ? 0.56 : 1, paddingHorizontal: spacing.xs / 2 }}
        >
            {({ pressed }) => (
                <View
                    testID={testID ? `${testID}-chip` : undefined}
                    style={{
                        alignItems: 'center',
                        backgroundColor: pressed && tone !== 'strong' ? tokens.surfacePressed : palette.background,
                        borderColor: palette.border,
                        borderRadius: radii.pill,
                        borderWidth: 1,
                        flexDirection: 'row',
                        gap: spacing.xs,
                        height: metrics.chip.action,
                        paddingHorizontal: metrics.rhythm.itemGap,
                    }}
                >
                    {icon ? <Icon name={icon} size={metrics.icon.sm} color={palette.color} decorative /> : null}
                    <AppText variant="button" style={{ color: palette.color }} numberOfLines={1}>
                        {label}
                    </AppText>
                </View>
            )}
        </Pressable>
    );
}
