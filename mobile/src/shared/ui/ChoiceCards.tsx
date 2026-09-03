import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { ReactNode } from 'react';

import { useResponsiveLayout, useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ChoiceCardsProps<T extends string> {
    label: string;
    description?: string;
    value: T;
    options: readonly T[];
    optionLabel: (option: T) => string;
    optionDescription?: (option: T) => string | undefined;
    optionIcon?: (option: T) => IconName | undefined;
    optionPreview?: (option: T) => ReactNode;
    onChange: (option: T) => void;
    accessibilityHint?: string;
    disabled?: boolean;
    layout?: 'grid' | 'stacked';
}

export function resolveChoiceCardsStacked(
    layout: 'grid' | 'stacked',
    sizeClass: ReturnType<typeof useResponsiveLayout>['sizeClass'],
    fontScale: number,
): boolean {
    return layout === 'stacked' || sizeClass === 'compact' || fontScale >= 1.6;
}

export function ChoiceCards<T extends string>({
    label,
    description,
    value,
    options,
    optionLabel,
    optionDescription,
    optionIcon,
    optionPreview,
    onChange,
    accessibilityHint,
    disabled = false,
    layout = 'grid',
}: ChoiceCardsProps<T>) {
    const { sizeClass } = useResponsiveLayout();
    const { fontScale, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [focusedOption, setFocusedOption] = useState<T | null>(null);
    const stacked = resolveChoiceCardsStacked(layout, sizeClass, fontScale);
    const cardBasis = sizeClass === 'regular' ? '46%' : '29%';

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
            <View style={{ flexDirection: stacked ? 'column' : 'row', flexWrap: stacked ? 'nowrap' : 'wrap', gap: spacing.sm }}>
                {options.map(option => {
                    const selected = option === value;
                    const focused = option === focusedOption;
                    const icon = optionIcon?.(option);
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
                                minHeight: minimumTouchTarget,
                                minWidth: 0,
                                opacity: disabled ? 0.48 : 1,
                                ...(stacked ? { alignSelf: 'stretch' } : { flexBasis: cardBasis, flexGrow: 1 }),
                            }}
                        >
                            {({ pressed }) => (
                                <View
                                    testID={`choice-card-surface-${option}`}
                                    style={{
                                        backgroundColor: selected ? tokens.surfaceSelected : pressed ? tokens.surfacePressed : tokens.surfaceMuted,
                                        borderColor: focused ? tokens.focus : selected ? tokens.accentBorder : tokens.separator,
                                        borderRadius: radii.card,
                                        borderWidth: 2,
                                        flex: 1,
                                        gap: spacing.xs,
                                        justifyContent: 'center',
                                        minHeight: minimumTouchTarget,
                                        padding: spacing.md,
                                    }}
                                >
                                    <View testID={`choice-card-row-${option}`} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
                                        {optionPreview?.(option) ??
                                            (icon ? (
                                                <View
                                                    accessibilityElementsHidden
                                                    style={{
                                                        alignItems: 'center',
                                                        backgroundColor: selected ? tokens.accent : tokens.accentSoft,
                                                        borderRadius: radii.control,
                                                        height: 36,
                                                        justifyContent: 'center',
                                                        width: 36,
                                                    }}
                                                >
                                                    <Icon name={icon} color={selected ? tokens.onAccent : tokens.accentText} decorative />
                                                </View>
                                            ) : null)}
                                        <View testID={`choice-card-copy-${option}`} style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                                            <AppText variant="label" tone={selected ? 'accent' : 'default'}>
                                                {optionLabel(option)}
                                            </AppText>
                                            {optionDescription ? (
                                                <AppText variant="caption" tone="muted">
                                                    {optionDescription(option)}
                                                </AppText>
                                            ) : null}
                                        </View>
                                        <View
                                            testID={`choice-card-indicator-${option}`}
                                            accessibilityElementsHidden
                                            style={{
                                                alignItems: 'center',
                                                borderColor: selected ? tokens.accentText : tokens.borderStrong,
                                                borderRadius: radii.pill,
                                                borderWidth: 2,
                                                flexShrink: 0,
                                                height: 24,
                                                justifyContent: 'center',
                                                width: 24,
                                            }}
                                        >
                                            {selected ? (
                                                <View style={{ backgroundColor: tokens.accentText, borderRadius: radii.pill, height: 10, width: 10 }} />
                                            ) : null}
                                        </View>
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
