import { useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { ChoiceGroup } from './ChoiceGroup';
import { Icon } from './Icon';
import { PressableBox as Pressable } from './PressableBox';

interface ChoiceRowProps<T extends string> {
    label: string;
    value: T;
    options: readonly T[];
    optionLabel: (option: T) => string;
    onChange: (option: T) => void;
    closeLabel: string;
    description?: string;
    optionDescription?: (option: T) => string | undefined;
    /** Supporting text in the sheet header. */
    sheetDescription?: string;
    disabled?: boolean;
    testID?: string;
}

/** Row with the current value that opens a sheet of exclusive choices; choosing applies and closes, closing changes nothing. */
export function ChoiceRow<T extends string>({
    label,
    value,
    options,
    optionLabel,
    onChange,
    closeLabel,
    description,
    optionDescription,
    sheetDescription,
    disabled = false,
    testID = 'choice-row',
}: ChoiceRowProps<T>) {
    const { metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [open, setOpen] = useState(false);

    const choose = (option: T) => {
        setOpen(false);
        if (option !== value) onChange(option);
    };

    return (
        <>
            <Pressable
                testID={testID}
                accessibilityLabel={`${label}: ${optionLabel(value)}`}
                accessibilityHint={description}
                accessibilityRole="button"
                accessibilityState={{ disabled, expanded: open }}
                disabled={disabled}
                onPress={() => setOpen(true)}
                // Fundo de toque e hover sangra `spacing.sm` para os lados sem mover o texto.
                style={({ pressed, hovered, focused }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? tokens.surfacePressed : hovered ? tokens.surfaceHover : 'transparent',
                    borderRadius: radii.control,
                    flexDirection: 'row',
                    gap: spacing.md,
                    marginHorizontal: -spacing.sm,
                    minHeight: minimumTouchTarget,
                    opacity: disabled ? 0.56 : 1,
                    outlineColor: tokens.focus,
                    outlineOffset: -2,
                    outlineWidth: focused ? 2 : 0,
                    paddingHorizontal: spacing.sm,
                })}
            >
                <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                    <AppText variant="label">{label}</AppText>
                    {description ? (
                        <AppText variant="caption" tone="muted">
                            {description}
                        </AppText>
                    ) : null}
                </View>
                <AppText tone="muted" numberOfLines={2} style={{ flexShrink: 1, maxWidth: '50%', textAlign: 'right' }}>
                    {optionLabel(value)}
                </AppText>
                <Icon name="chevron-down" size={metrics.icon.md} color={tokens.muted} decorative />
            </Pressable>
            <BottomSheet
                visible={open}
                onClose={() => setOpen(false)}
                closeLabel={closeLabel}
                title={label}
                description={sheetDescription}
                testIDs={{ sheet: `${testID}-sheet`, backdrop: `${testID}-backdrop`, layer: `${testID}-layer` }}
            >
                <ChoiceGroup
                    label={label}
                    value={value}
                    options={options}
                    optionLabel={optionLabel}
                    optionDescription={optionDescription}
                    onChange={choose}
                    layout="stacked"
                    hideLabel
                />
            </BottomSheet>
        </>
    );
}
