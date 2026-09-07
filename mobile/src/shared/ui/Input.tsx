import { type ReactNode, useState } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { FONTS, useTheme } from '@/shared/theme';

import { AppText } from './AppText';

interface Props extends Omit<TextInputProps, 'onBlur' | 'onChange' | 'onChangeText' | 'style' | 'value'> {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
    helperText?: string;
    labelAction?: ReactNode;
    leading?: ReactNode;
    trailing?: ReactNode;
    onBlur?: () => void;
}

export function Input({
    label,
    value,
    onChange,
    placeholder,
    error,
    helperText,
    labelAction,
    leading,
    trailing,
    onBlur,
    onFocus,
    multiline,
    editable = true,
    autoCapitalize = 'sentences',
    autoCorrect = false,
    ...textInputProps
}: Props) {
    const { layout, minimumTouchTarget, radii, spacing, textStyles, tokens } = useTheme();
    const [focused, setFocused] = useState(false);
    const borderColor = error ? tokens.danger : focused ? tokens.focus : tokens.inputBorder;

    return (
        <View style={{ marginBottom: spacing.md }}>
            {label && (
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <AppText variant="label" tone={error ? 'danger' : 'default'}>
                        {label}
                    </AppText>
                    {labelAction}
                </View>
            )}
            <View
                style={{
                    alignItems: multiline ? 'flex-start' : 'center',
                    backgroundColor: tokens.inputBg,
                    borderColor,
                    borderRadius: radii.control,
                    borderWidth: focused || error ? 2 : 1,
                    flexDirection: 'row',
                    gap: spacing.sm,
                    minHeight: multiline ? Math.max(96, minimumTouchTarget) : Math.max(layout.controlHeight, minimumTouchTarget),
                    paddingHorizontal: spacing.md,
                }}
            >
                {leading}
                <TextInput
                    {...textInputProps}
                    accessible
                    accessibilityLabel={textInputProps.accessibilityLabel ?? label}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={tokens.placeholder}
                    multiline={multiline}
                    editable={editable}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
                    onFocus={event => {
                        setFocused(true);
                        onFocus?.(event);
                    }}
                    onBlur={() => {
                        setFocused(false);
                        onBlur?.();
                    }}
                    style={{
                        color: editable ? tokens.text : tokens.disabled,
                        flex: 1,
                        fontFamily: FONTS.regular,
                        fontSize: textStyles.body.fontSize,
                        lineHeight: textStyles.body.lineHeight,
                        minHeight: multiline ? 88 : layout.compactControlHeight,
                        paddingVertical: spacing.sm,
                        textAlignVertical: multiline ? 'top' : 'center',
                    }}
                />
                {trailing}
            </View>
            {error ? (
                <AppText accessibilityRole="alert" variant="caption" tone="danger" style={{ marginTop: spacing.sm }}>
                    {error}
                </AppText>
            ) : helperText ? (
                <AppText variant="caption" tone="subtle" style={{ marginTop: spacing.sm }}>
                    {helperText}
                </AppText>
            ) : null}
        </View>
    );
}
