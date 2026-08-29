import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

const SELECTION_BADGE_SIZE = 24;
const SWATCH_HEIGHT = 54;

interface SwatchPickerProps<T extends string> {
    label: string;
    description?: string;
    value: T;
    options: readonly T[];
    optionLabel: (option: T) => string;
    optionColor: (option: T) => string;
    onChange: (option: T) => void;
    disabled?: boolean;
}

export function SwatchPicker<T extends string>({
    label,
    description,
    value,
    options,
    optionLabel,
    optionColor,
    onChange,
    disabled = false,
}: SwatchPickerProps<T>) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [focusedOption, setFocusedOption] = useState<T | null>(null);
    const swatchSize = Math.max(SWATCH_HEIGHT, minimumTouchTarget);

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
                    borderColor: tokens.borderStrong,
                    borderRadius: radii.control,
                    borderWidth: 1,
                    flexDirection: 'row',
                    height: swatchSize,
                    overflow: 'hidden',
                }}
            >
                {options.map((option, index) => {
                    const selected = option === value;
                    const focused = option === focusedOption;
                    return (
                        <View
                            key={option}
                            style={{
                                alignItems: 'center',
                                backgroundColor: optionColor(option),
                                borderColor: focused ? tokens.focus : selected ? tokens.accent : tokens.borderStrong,
                                borderWidth: focused || selected ? 3 : 0,
                                borderLeftWidth: focused || selected ? 3 : index === 0 ? 0 : 1,
                                flex: 1,
                                height: swatchSize,
                                justifyContent: 'center',
                                minWidth: 0,
                                opacity: disabled ? 0.5 : 1,
                            }}
                        >
                            <Pressable
                                accessibilityLabel={optionLabel(option)}
                                accessibilityRole="radio"
                                accessibilityState={{ disabled, selected }}
                                disabled={disabled}
                                onBlur={() => setFocusedOption(current => (current === option ? null : current))}
                                onFocus={() => setFocusedOption(option)}
                                onPress={() => onChange(option)}
                                style={({ pressed }) => [
                                    StyleSheet.absoluteFillObject,
                                    { alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.72 : 1 },
                                ]}
                            >
                                {selected ? (
                                    <View
                                        accessibilityElementsHidden
                                        pointerEvents="none"
                                        style={{
                                            alignItems: 'center',
                                            backgroundColor: tokens.accent,
                                            borderRadius: radii.pill,
                                            height: SELECTION_BADGE_SIZE,
                                            justifyContent: 'center',
                                            width: SELECTION_BADGE_SIZE,
                                        }}
                                    >
                                        <Icon name="checkmark" color={tokens.onAccent} size={16} decorative />
                                    </View>
                                ) : null}
                            </Pressable>
                        </View>
                    );
                })}
            </View>
            <AppText accessibilityLiveRegion="polite" variant="caption" tone="accent" style={{ textAlign: 'center' }}>
                {optionLabel(value)}
            </AppText>
        </View>
    );
}
