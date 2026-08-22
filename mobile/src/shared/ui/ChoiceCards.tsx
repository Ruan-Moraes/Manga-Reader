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
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const stacked = layout === 'stacked' || sizeClass === 'compact';
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
                    const icon = optionIcon?.(option);
                    return (
                        <Pressable
                            key={option}
                            accessibilityHint={accessibilityHint}
                            accessibilityLabel={optionLabel(option)}
                            accessibilityRole="radio"
                            accessibilityState={{ disabled, selected }}
                            disabled={disabled}
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
                                    style={{
                                        backgroundColor: selected ? tokens.accentSoft : pressed ? tokens.surfacePressed : tokens.surfaceMuted,
                                        borderColor: selected ? tokens.accentBorder : tokens.separator,
                                        borderRadius: radii.card,
                                        borderWidth: selected ? 2 : 1,
                                        flex: 1,
                                        gap: spacing.sm,
                                        justifyContent: 'center',
                                        minHeight: minimumTouchTarget,
                                        padding: spacing.md,
                                    }}
                                >
                                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                                        {optionPreview?.(option) ?? (icon ? <Icon name={icon} decorative /> : null)}
                                        <AppText variant="label" tone={selected ? 'accent' : 'default'} style={{ flex: 1 }}>
                                            {optionLabel(option)}
                                        </AppText>
                                        {selected ? <Icon name="checkmark-circle" decorative /> : null}
                                    </View>
                                    {optionDescription ? (
                                        <AppText variant="caption" tone="muted">
                                            {optionDescription(option)}
                                        </AppText>
                                    ) : null}
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
