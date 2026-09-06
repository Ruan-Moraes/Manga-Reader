import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';

const SWITCH_CONTROL_WIDTH = 52;

interface SwitchRowProps {
    label: string;
    description?: string;
    value: boolean;
    onChange: (value: boolean) => void;
    accessibilityHint?: string;
    disabled?: boolean;
}

export function resolveSwitchRowStacked(fontScale: number): boolean {
    return fontScale >= 1.6;
}

export function SwitchRow({ label, description, value, onChange, accessibilityHint, disabled = false }: SwitchRowProps) {
    const { fontScale, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [focused, setFocused] = useState(false);
    const stacked = resolveSwitchRowStacked(fontScale);

    return (
        <Pressable
            accessible={false}
            disabled={disabled}
            onPress={() => onChange(!value)}
            style={({ pressed }) => ({
                backgroundColor: pressed ? tokens.surfacePressed : 'transparent',
                borderColor: focused ? tokens.focus : 'transparent',
                borderRadius: radii.control,
                borderWidth: 2,
                minHeight: minimumTouchTarget,
                opacity: disabled ? 0.56 : 1,
                paddingHorizontal: spacing.xs,
                paddingVertical: spacing.sm,
            })}
        >
            <View
                testID="switch-row-content"
                style={{ alignItems: stacked ? 'stretch' : 'center', flexDirection: stacked ? 'column' : 'row', gap: spacing.md, minWidth: 0 }}
            >
                <View
                    testID="switch-row-copy"
                    style={{
                        flexBasis: stacked ? undefined : 0,
                        flexGrow: stacked ? 0 : 1,
                        flexShrink: stacked ? 0 : 1,
                        gap: spacing.xs,
                        minWidth: 0,
                        width: stacked ? '100%' : undefined,
                    }}
                >
                    <AppText variant="label" tone={disabled ? 'subtle' : 'default'}>
                        {label}
                    </AppText>
                    {description ? (
                        <AppText variant="caption" tone="subtle">
                            {description}
                        </AppText>
                    ) : null}
                </View>
                <View
                    testID="switch-row-control"
                    style={{
                        alignItems: 'flex-end',
                        alignSelf: stacked ? 'flex-end' : undefined,
                        flexShrink: 0,
                        justifyContent: 'center',
                        minWidth: SWITCH_CONTROL_WIDTH,
                        width: SWITCH_CONTROL_WIDTH,
                    }}
                >
                    <Switch
                        accessibilityHint={accessibilityHint}
                        accessibilityLabel={label}
                        accessibilityState={{ checked: value, disabled }}
                        disabled={disabled}
                        onBlur={() => setFocused(false)}
                        onFocus={() => setFocused(true)}
                        onValueChange={onChange}
                        pointerEvents="none"
                        thumbColor={value ? tokens.onAccent : tokens.surface}
                        trackColor={{ false: tokens.inputBorder, true: tokens.accent }}
                        value={value}
                    />
                </View>
            </View>
        </Pressable>
    );
}
