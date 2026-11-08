import { Pressable } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface TextActionProps {
    label: string;
    onPress: () => void;
    icon?: IconName;
    tone?: 'accent' | 'muted';
    accessibilityLabel?: string;
    disabled?: boolean;
    testID?: string;
}

/** Text-only action; the touch area grows sideways without shifting the text alignment. */
export function TextAction({ label, onPress, icon, tone = 'accent', accessibilityLabel, disabled = false, testID }: TextActionProps) {
    const { metrics, minimumTouchTarget, spacing, tokens } = useTheme();

    const color = tone === 'muted' ? tokens.muted : tokens.accentText;

    return (
        <Pressable
            testID={testID}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: 'center',
                alignSelf: 'flex-start',
                flexDirection: 'row',
                gap: spacing.xs,
                marginHorizontal: -spacing.sm,
                minHeight: minimumTouchTarget,
                opacity: disabled ? 0.56 : pressed ? 0.72 : 1,
                paddingHorizontal: spacing.sm,
            })}
        >
            {icon ? <Icon name={icon} size={metrics.icon.sm} color={color} decorative /> : null}
            <AppText variant="button" style={{ color }}>
                {label}
            </AppText>
        </Pressable>
    );
}
