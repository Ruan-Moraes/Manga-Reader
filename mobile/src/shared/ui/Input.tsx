import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

interface Props {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    error?: string;
    multiline?: boolean;
    autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    onBlur?: () => void;
}

export function Input({
    label,
    value,
    onChange,
    placeholder,
    secureTextEntry,
    error,
    multiline,
    autoCapitalize = 'sentences',
    keyboardType = 'default',
    onBlur,
}: Props) {
    const { tokens } = useTheme();
    const [focused, setFocused] = useState(false);
    const borderColor = error ? tokens.danger : focused ? tokens.accent : tokens.inputBorder;

    return (
        <View style={{ marginBottom: 16 }}>
            {label && (
                <Text
                    style={{
                        fontSize: 11,
                        fontFamily: FONTS.extrabold,
                        letterSpacing: 1.1,
                        textTransform: 'uppercase',
                        color: error ? tokens.danger : tokens.accent,
                        marginBottom: 7,
                    }}
                >
                    {label}
                </Text>
            )}
            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={tokens.tertiary}
                secureTextEntry={secureTextEntry}
                multiline={multiline}
                autoCapitalize={autoCapitalize}
                autoCorrect={false}
                keyboardType={keyboardType}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                    setFocused(false);
                    onBlur?.();
                }}
                style={{
                    height: multiline ? undefined : tokens.controlHeight,
                    minHeight: multiline ? 80 : undefined,
                    paddingHorizontal: 14,
                    paddingVertical: multiline ? 12 : undefined,
                    backgroundColor: tokens.inputBg,
                    color: tokens.text,
                    borderWidth: 1,
                    borderColor,
                    borderRadius: tokens.radius,
                    fontFamily: FONTS.regular,
                    fontSize: 15,
                    letterSpacing: tokens.ls,
                }}
            />
            {error && <Text style={{ marginTop: 6, fontSize: 11, color: tokens.danger, fontFamily: FONTS.regular }}>{error}</Text>}
        </View>
    );
}
