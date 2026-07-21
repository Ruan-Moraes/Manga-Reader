import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { FONTS, useTheme } from '@/src/shared/theme';

import { MRIcon } from './MRIcon';

type IconName = React.ComponentProps<typeof MRIcon>['name'];

interface Props {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    icon?: IconName;
    type?: 'text' | 'email' | 'password';
    error?: string;
    hint?: string;
    rightSlot?: React.ReactNode;
    trailing?: React.ReactNode;
    autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
    inputMode?: 'email' | 'text' | 'none';
    onBlur?: () => void;
}

export function Field({
    label,
    value,
    onChange,
    placeholder,
    icon,
    type = 'text',
    error,
    hint,
    rightSlot,
    trailing,
    autoCapitalize = 'none',
    inputMode,
    onBlur,
}: Props) {
    const { tokens } = useTheme();
    const [focused, setFocused] = useState(false);
    const borderColor = error ? tokens.danger : focused ? tokens.accentBorder : tokens.inputBorder;
    const iconColor = focused ? tokens.accentText : tokens.tertiary;
    const labelColor = error ? tokens.danger : tokens.accentText;

    return (
        <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 7 }}>
                <Text
                    style={{ fontSize: 11, fontWeight: '800', fontFamily: FONTS.extrabold, letterSpacing: 1.1, textTransform: 'uppercase', color: labelColor }}
                >
                    {label}
                </Text>
                {rightSlot}
            </View>

            <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
                {icon && (
                    <View pointerEvents="none" style={{ position: 'absolute', left: 14, zIndex: 1 }}>
                        <MRIcon name={icon} size={18} color={iconColor} />
                    </View>
                )}
                <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={tokens.placeholder}
                    secureTextEntry={type === 'password'}
                    keyboardType={inputMode === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={false}
                    onFocus={() => setFocused(true)}
                    onBlur={() => {
                        setFocused(false);
                        onBlur?.();
                    }}
                    style={{
                        flex: 1,
                        height: tokens.controlHeight,
                        paddingLeft: icon ? 42 : 14,
                        paddingRight: trailing ? 46 : 14,
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
                {trailing}
            </View>

            {error && error.trim() ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 }}>
                    <MRIcon name="alert" size={13} color={tokens.danger} />
                    <Text style={{ fontSize: 11, color: tokens.danger, letterSpacing: tokens.ls, fontFamily: FONTS.regular }}>{error}</Text>
                </View>
            ) : hint ? (
                <Text style={{ marginTop: 7, fontSize: 11, color: tokens.tertiary, letterSpacing: tokens.ls, fontFamily: FONTS.regular }}>{hint}</Text>
            ) : null}
        </View>
    );
}
