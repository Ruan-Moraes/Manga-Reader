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
    /** Marks the field when a shared error message is displayed elsewhere. */
    invalid?: boolean;
    helperText?: string;
    labelAction?: ReactNode;
    leading?: ReactNode;
    trailing?: ReactNode;
    onBlur?: () => void;
}

/**
 * Form field. Form rhythm used across the app: label → field `spacing.sm`, field → next field or the primary action
 * `spacing.md` (this component's bottom margin), so screens do not add their own spacers.
 */
export function Input({
    label,
    value,
    onChange,
    placeholder,
    error,
    invalid = false,
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
    const hasError = invalid || Boolean(error);
    const borderColor = hasError ? tokens.danger : focused ? tokens.focus : tokens.inputBorder;

    return (
        <View style={{ marginBottom: spacing.md }}>
            {label && (
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <AppText variant="label" tone={hasError ? 'danger' : 'default'}>
                        {label}
                    </AppText>
                    {labelAction ? (
                        // The action keeps its 44 pt target but overlaps the row, so the label stays as close to the
                        // field as a label without an action.
                        <View style={{ marginVertical: -Math.max(0, (minimumTouchTarget - (textStyles.label.lineHeight ?? minimumTouchTarget)) / 2) }}>
                            {labelAction}
                        </View>
                    ) : null}
                </View>
            )}
            <View
                style={{
                    alignItems: multiline ? 'flex-start' : 'center',
                    backgroundColor: tokens.inputBg,
                    borderColor,
                    borderRadius: radii.control,
                    borderWidth: focused || hasError ? 2 : 1,
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
