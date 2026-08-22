import { Pressable, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';

interface SegmentedControlProps<T extends string> {
    label: string;
    description?: string;
    value: T;
    options: readonly T[];
    optionLabel: (option: T) => string;
    onChange: (option: T) => void;
    accessibilityHint?: string;
    disabled?: boolean;
}

export function SegmentedControl<T extends string>({
    label,
    description,
    value,
    options,
    optionLabel,
    onChange,
    accessibilityHint,
    disabled = false,
}: SegmentedControlProps<T>) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();

    return (
        <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: spacing.sm }}>
            <View style={{ gap: spacing.xs }}>
                <AppText variant="label">{label}</AppText>
                {description ? (
                    <AppText variant="caption" tone="muted">
                        {description}
                    </AppText>
                ) : null}
            </View>
            <View
                style={{
                    backgroundColor: tokens.surfaceMuted,
                    borderColor: tokens.separator,
                    borderRadius: radii.control,
                    borderWidth: 1,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: spacing.xs,
                    padding: spacing.xs,
                }}
            >
                {options.map(option => {
                    const selected = option === value;
                    return (
                        <Pressable
                            key={option}
                            accessibilityHint={accessibilityHint}
                            accessibilityLabel={optionLabel(option)}
                            accessibilityRole="radio"
                            accessibilityState={{ disabled, selected }}
                            disabled={disabled}
                            onPress={() => onChange(option)}
                            style={({ pressed }) => ({
                                alignItems: 'center',
                                backgroundColor: selected ? tokens.accentSoft : pressed ? tokens.surfacePressed : 'transparent',
                                borderColor: selected ? tokens.accentBorder : 'transparent',
                                borderRadius: radii.control,
                                borderWidth: 1,
                                flex: 1,
                                justifyContent: 'center',
                                minHeight: minimumTouchTarget,
                                minWidth: 82,
                                opacity: disabled ? 0.48 : 1,
                                paddingHorizontal: spacing.sm,
                                paddingVertical: spacing.sm,
                            })}
                        >
                            <AppText variant="label" tone={selected ? 'accent' : 'muted'} style={{ textAlign: 'center' }}>
                                {optionLabel(option)}
                            </AppText>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
