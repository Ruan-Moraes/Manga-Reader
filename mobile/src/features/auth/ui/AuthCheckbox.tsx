import { Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

import { MRIcon } from './MRIcon';

interface Props {
    checked: boolean;
    onChange: () => void;
    children: React.ReactNode;
    error?: string;
}

export function AuthCheckbox({ checked, onChange, children, error }: Props) {
    const { tokens } = useTheme();
    const borderColor = checked ? tokens.accent : error ? tokens.danger : tokens.tertiary;

    return (
        <TouchableOpacity
            onPress={onChange}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, paddingVertical: 2 }}
        >
            <View
                style={{
                    width: 20,
                    height: 20,
                    flexShrink: 0,
                    borderRadius: tokens.radius,
                    borderWidth: 1.5,
                    borderColor,
                    backgroundColor: checked ? tokens.accent : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {checked && <MRIcon name="check" size={13} color={tokens.bg} strokeWidth={3} />}
            </View>
            <Text
                style={{
                    flex: 1,
                    fontFamily: FONTS.regular,
                    fontSize: 13,
                    color: error ? tokens.danger : tokens.muted,
                    letterSpacing: tokens.ls,
                    lineHeight: 19,
                }}
            >
                {children}
            </Text>
        </TouchableOpacity>
    );
}
