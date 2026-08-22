import { TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';

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
}: ChoiceGroupProps<T>) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();

    return (
        <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: spacing.sm }}>
            <AppText variant="label">{label}</AppText>
            <View style={{ flexDirection: layout === 'stacked' ? 'column' : 'row', flexWrap: layout === 'stacked' ? 'nowrap' : 'wrap', gap: spacing.sm }}>
                {options.map(option => {
                    const selected = option === value;
                    return (
                        <TouchableOpacity
                            key={option}
                            accessibilityLabel={optionLabel(option)}
                            accessibilityHint={accessibilityHint}
                            accessibilityRole="radio"
                            accessibilityState={{ disabled, selected }}
                            activeOpacity={0.76}
                            onPress={() => onChange(option)}
                            disabled={disabled}
                            style={{
                                alignItems: optionDescription ? 'flex-start' : 'center',
                                backgroundColor: selected ? tokens.surfaceSelected : tokens.surface,
                                borderColor: selected ? tokens.focus : tokens.inputBorder,
                                borderRadius: radii.control,
                                borderWidth: selected ? 2 : 1,
                                justifyContent: 'center',
                                minHeight: minimumTouchTarget,
                                opacity: disabled ? 0.46 : 1,
                                paddingHorizontal: spacing.md,
                                paddingVertical: spacing.sm,
                            }}
                        >
                            <AppText variant="label" style={selected ? { color: tokens.accentText } : undefined}>
                                {optionLabel(option)}
                            </AppText>
                            {optionDescription ? (
                                <AppText variant="caption" tone="muted">
                                    {optionDescription(option)}
                                </AppText>
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
