import { View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { PressableBox as Pressable } from './PressableBox';

interface TextActionProps {
    label: string;
    onPress: () => void;
    icon?: IconName;
    tone?: 'accent' | 'muted' | 'danger';
    accessibilityLabel?: string;
    disabled?: boolean;
    testID?: string;
    /** Ícone num quadro de fundo suave, centrado na vertical com o texto (atalhos de destaque). */
    iconTile?: boolean;
    align?: 'start' | 'center';
}

/** Text-only action; the touch area grows sideways without shifting the text alignment. */
export function TextAction({
    label,
    onPress,
    icon,
    tone = 'accent',
    accessibilityLabel,
    disabled = false,
    testID,
    iconTile = false,
    align = 'start',
}: TextActionProps) {
    const { metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();

    const color = tone === 'muted' ? tokens.muted : tone === 'danger' ? tokens.danger : tokens.accentText;

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
                alignSelf: align === 'center' ? 'center' : 'flex-start',
                flexDirection: 'row',
                gap: iconTile ? spacing.sm : spacing.xs,
                marginHorizontal: -spacing.sm,
                minHeight: minimumTouchTarget,
                opacity: disabled ? 0.56 : pressed ? 0.72 : 1,
                paddingHorizontal: spacing.sm,
            })}
        >
            {icon && iconTile ? (
                <View
                    testID={testID ? `${testID}-icon-tile` : 'text-action-icon-tile'}
                    style={{
                        alignItems: 'center',
                        backgroundColor: tone === 'muted' ? tokens.surfaceMuted : tokens.accentSoft,
                        borderRadius: radii.sm,
                        height: 32,
                        justifyContent: 'center',
                        width: 32,
                    }}
                >
                    <Icon name={icon} size={metrics.icon.md} color={color} decorative />
                </View>
            ) : icon ? (
                <Icon name={icon} size={metrics.icon.sm} color={color} decorative />
            ) : null}
            <AppText variant="button" style={{ color }}>
                {label}
            </AppText>
        </Pressable>
    );
}
