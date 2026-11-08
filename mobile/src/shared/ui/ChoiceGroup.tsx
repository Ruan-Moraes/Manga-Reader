import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';

const RADIO_SIZE = 22;
const RADIO_DOT_SIZE = 10;

interface ChoiceGroupProps<T extends string> {
    label: string;
    value: T;
    options: readonly T[];
    optionLabel: (option: T) => string;
    optionDescription?: (option: T) => string | undefined;
    onChange: (option: T) => void;
    accessibilityHint?: string;
    disabled?: boolean;
    layout?: 'horizontal' | 'stacked';
    /** Keeps the group label for assistive tech only (used when a sheet title already names it). */
    hideLabel?: boolean;
}

export function resolveChoiceGroupStacked(layout: 'horizontal' | 'stacked', fontScale: number): boolean {
    return layout === 'stacked' || fontScale >= 1.6;
}

export function ChoiceGroup<T extends string>({
    label,
    value,
    options,
    optionLabel,
    optionDescription,
    onChange,
    accessibilityHint,
    disabled = false,
    layout = 'horizontal',
    hideLabel = false,
}: ChoiceGroupProps<T>) {
    const { fontScale, metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [focusedOption, setFocusedOption] = useState<T | null>(null);
    const stacked = resolveChoiceGroupStacked(layout, fontScale);

    return (
        <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: spacing.sm }}>
            {hideLabel ? null : <AppText variant="label">{label}</AppText>}
            <View style={{ flexDirection: stacked ? 'column' : 'row', flexWrap: stacked ? 'nowrap' : 'wrap', gap: spacing.sm }}>
                {options.map(option => {
                    const selected = option === value;
                    const focused = option === focusedOption;
                    return (
                        <Pressable
                            key={option}
                            accessibilityLabel={optionLabel(option)}
                            accessibilityHint={accessibilityHint}
                            accessibilityRole="radio"
                            accessibilityState={{ disabled, selected }}
                            disabled={disabled}
                            onBlur={() => setFocusedOption(current => (current === option ? null : current))}
                            onFocus={() => setFocusedOption(option)}
                            onPress={() => onChange(option)}
                            style={{
                                minHeight: minimumTouchTarget,
                                maxWidth: '100%',
                                minWidth: 0,
                                opacity: disabled ? 0.46 : 1,
                                ...(stacked ? { alignSelf: 'stretch' } : {}),
                            }}
                        >
                            {({ pressed }) => (
                                <View
                                    testID={`choice-group-row-${option}`}
                                    style={{
                                        alignItems: 'center',
                                        backgroundColor: pressed ? tokens.surfacePressed : selected ? tokens.surfaceSelected : tokens.surface,
                                        borderColor: focused ? tokens.focus : selected ? tokens.accentBorder : tokens.inputBorder,
                                        borderRadius: radii.control,
                                        borderWidth: 2,
                                        flexDirection: 'row',
                                        gap: stacked ? metrics.rhythm.itemGap : spacing.sm,
                                        maxWidth: '100%',
                                        minHeight: stacked ? Math.max(minimumTouchTarget, metrics.row.single) : minimumTouchTarget,
                                        paddingHorizontal: spacing.md,
                                        paddingVertical: stacked ? metrics.rhythm.itemGap : spacing.sm,
                                        width: stacked ? '100%' : undefined,
                                    }}
                                >
                                    <View
                                        testID={`choice-group-indicator-${option}`}
                                        accessibilityElementsHidden
                                        style={{
                                            alignItems: 'center',
                                            borderColor: selected ? tokens.accent : tokens.borderStrong,
                                            borderRadius: radii.pill,
                                            borderWidth: 2,
                                            flexShrink: 0,
                                            height: RADIO_SIZE,
                                            justifyContent: 'center',
                                            width: RADIO_SIZE,
                                        }}
                                    >
                                        {selected ? (
                                            <View
                                                style={{
                                                    backgroundColor: tokens.accent,
                                                    borderRadius: radii.pill,
                                                    height: RADIO_DOT_SIZE,
                                                    width: RADIO_DOT_SIZE,
                                                }}
                                            />
                                        ) : null}
                                    </View>
                                    <View testID={`choice-group-copy-${option}`} style={{ flexShrink: 1, gap: spacing.xs, minWidth: 0 }}>
                                        <AppText variant="label" tone={selected ? 'accent' : 'default'}>
                                            {optionLabel(option)}
                                        </AppText>
                                        {optionDescription ? (
                                            <AppText variant="caption" tone="muted">
                                                {optionDescription(option)}
                                            </AppText>
                                        ) : null}
                                    </View>
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
