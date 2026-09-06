import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useResponsiveLayout, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

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

export function resolveSegmentedControlStacked(sizeClass: ReturnType<typeof useResponsiveLayout>['sizeClass'], fontScale: number): boolean {
    return sizeClass === 'compact' || fontScale >= 1.6;
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
    const { sizeClass } = useResponsiveLayout();
    const { fontScale, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [focusedOption, setFocusedOption] = useState<T | null>(null);
    const stacked = resolveSegmentedControlStacked(sizeClass, fontScale);

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
                    flexDirection: stacked ? 'column' : 'row',
                    gap: spacing.xs,
                    padding: spacing.xs,
                }}
            >
                {options.map(option => {
                    const selected = option === value;
                    const focused = option === focusedOption;
                    return (
                        <Pressable
                            key={option}
                            accessibilityHint={accessibilityHint}
                            accessibilityLabel={optionLabel(option)}
                            accessibilityRole="radio"
                            accessibilityState={{ disabled, selected }}
                            disabled={disabled}
                            onBlur={() => setFocusedOption(current => (current === option ? null : current))}
                            onFocus={() => setFocusedOption(option)}
                            onPress={() => onChange(option)}
                            style={{
                                flex: stacked ? undefined : 1,
                                minHeight: minimumTouchTarget,
                                minWidth: stacked ? undefined : 82,
                                opacity: disabled ? 0.48 : 1,
                                width: stacked ? '100%' : undefined,
                            }}
                        >
                            {({ pressed }) => (
                                <View
                                    testID={`segmented-option-surface-${option}`}
                                    style={{
                                        alignItems: 'center',
                                        backgroundColor: selected ? tokens.accent : pressed ? tokens.surfacePressed : tokens.surface,
                                        borderColor: focused ? tokens.focus : selected ? tokens.accent : tokens.inputBorder,
                                        borderRadius: radii.control,
                                        borderWidth: 2,
                                        flex: 1,
                                        flexDirection: 'row',
                                        gap: spacing.xs,
                                        justifyContent: 'center',
                                        minHeight: minimumTouchTarget,
                                        paddingHorizontal: spacing.sm,
                                        paddingVertical: spacing.sm,
                                        width: '100%',
                                    }}
                                >
                                    <AppText
                                        variant="label"
                                        tone={selected ? 'default' : 'muted'}
                                        style={{ color: selected ? tokens.onAccent : tokens.muted, textAlign: 'center' }}
                                    >
                                        {optionLabel(option)}
                                    </AppText>
                                    {selected && stacked ? <Icon name="checkmark-circle" size={18} decorative /> : null}
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
