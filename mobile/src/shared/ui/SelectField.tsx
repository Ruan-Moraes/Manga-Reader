import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

interface SelectFieldProps<T extends string> {
    label: string;
    description?: string;
    value: T;
    options: readonly T[];
    optionLabel: (option: T) => string;
    optionDescription?: (option: T) => string | undefined;
    onChange: (option: T) => void;
    closeLabel: string;
    disabled?: boolean;
}

export function SelectField<T extends string>({
    label,
    description,
    value,
    options,
    optionLabel,
    optionDescription,
    onChange,
    closeLabel,
    disabled = false,
}: SelectFieldProps<T>) {
    const [open, setOpen] = useState(false);
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const choose = (option: T) => {
        onChange(option);
        setOpen(false);
    };

    return (
        <View style={{ gap: spacing.sm }}>
            <View style={{ gap: spacing.xs }}>
                <AppText variant="label">{label}</AppText>
                {description ? (
                    <AppText variant="caption" tone="muted">
                        {description}
                    </AppText>
                ) : null}
            </View>
            <Pressable
                accessibilityLabel={`${label}: ${optionLabel(value)}`}
                accessibilityRole="button"
                accessibilityState={{ disabled, expanded: open }}
                disabled={disabled}
                onPress={() => setOpen(true)}
                style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: disabled ? tokens.disabledSurface : pressed ? tokens.surfacePressed : tokens.inputBg,
                    borderColor: open ? tokens.focus : tokens.inputBorder,
                    borderRadius: radii.control,
                    borderWidth: open ? 2 : 1,
                    flexDirection: 'row',
                    gap: spacing.sm,
                    minHeight: minimumTouchTarget,
                    opacity: disabled ? 0.56 : 1,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                })}
            >
                <AppText style={{ flex: 1 }}>{optionLabel(value)}</AppText>
                <Icon name="chevron-down" decorative />
            </Pressable>
            <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
                <SafeAreaView style={{ backgroundColor: tokens.scrim, flex: 1, justifyContent: 'flex-end' }}>
                    <Pressable accessibilityLabel={closeLabel} onPress={() => setOpen(false)} style={{ flex: 1 }} />
                    <View
                        accessibilityViewIsModal
                        style={{
                            backgroundColor: tokens.surface,
                            borderTopLeftRadius: radii.feature,
                            borderTopRightRadius: radii.feature,
                            gap: spacing.md,
                            maxHeight: '72%',
                            padding: spacing.lg,
                        }}
                    >
                        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                            <AppText accessibilityRole="header" variant="title" style={{ flex: 1 }}>
                                {label}
                            </AppText>
                            <IconButton accessibilityLabel={closeLabel} icon="close" onPress={() => setOpen(false)} />
                        </View>
                        <ScrollView contentContainerStyle={{ gap: spacing.sm }}>
                            {options.map(option => {
                                const selected = option === value;
                                return (
                                    <Pressable
                                        key={option}
                                        accessibilityLabel={optionLabel(option)}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected }}
                                        onPress={() => choose(option)}
                                        style={({ pressed }) => ({
                                            backgroundColor: selected ? tokens.surfaceSelected : pressed ? tokens.surfacePressed : tokens.surface,
                                            borderColor: selected ? tokens.focus : tokens.separator,
                                            borderRadius: radii.control,
                                            borderWidth: selected ? 2 : 1,
                                            gap: spacing.xs,
                                            minHeight: minimumTouchTarget,
                                            padding: spacing.md,
                                        })}
                                    >
                                        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
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
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
}
