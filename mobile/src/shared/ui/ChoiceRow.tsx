import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { ChoiceGroup } from './ChoiceGroup';
import { Icon } from './Icon';

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
    const { metrics, minimumTouchTarget, spacing, tokens } = useTheme();
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
                style={({ pressed }) => ({
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: spacing.md,
                    minHeight: minimumTouchTarget,
                    opacity: disabled ? 0.56 : pressed ? 0.72 : 1,
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
