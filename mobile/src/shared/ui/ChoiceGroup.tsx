import { TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';

interface ChoiceGroupProps<T extends string> {
    label: string;
    value: T;
    options: readonly T[];
    optionLabel: (option: T) => string;
    onChange: (option: T) => void;
    accessibilityHint?: string;
}

export function ChoiceGroup<T extends string>({ label, value, options, optionLabel, onChange, accessibilityHint }: ChoiceGroupProps<T>) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();

    return (
        <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: spacing.sm }}>
            <AppText variant="label">{label}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {options.map(option => {
                    const selected = option === value;
                    return (
                        <TouchableOpacity
                            key={option}
                            accessibilityLabel={optionLabel(option)}
                            accessibilityHint={accessibilityHint}
                            accessibilityRole="radio"
                            accessibilityState={{ disabled: false, selected }}
                            activeOpacity={0.8}
                            onPress={() => onChange(option)}
                            style={{
                                alignItems: 'center',
                                backgroundColor: selected ? tokens.accent : tokens.surface,
                                borderColor: selected ? tokens.focus : tokens.inputBorder,
                                borderRadius: radii.control,
                                borderWidth: selected ? 2 : 1,
                                justifyContent: 'center',
                                minHeight: minimumTouchTarget,
                                paddingHorizontal: spacing.md,
                                paddingVertical: spacing.sm,
                            }}
                        >
                            <AppText variant="label" style={selected ? { color: tokens.onAccent } : undefined}>
                                {optionLabel(option)}
                            </AppText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
