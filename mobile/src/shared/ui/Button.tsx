import { ReactNode } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

type Variant = 'primary' | 'ghost' | 'outline';

interface Props {
    children: ReactNode;
    onPress?: () => void;
    variant?: Variant;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
}

export function Button({ children, onPress, variant = 'primary', loading, disabled, fullWidth = true }: Props) {
    const { tokens } = useTheme();
    const off = loading || disabled;

    const bg = variant === 'primary' ? (off ? tokens.inputBorder : tokens.accent) : 'transparent';

    const borderColor = variant === 'outline' ? (off ? tokens.inputBorder : tokens.accent) : 'transparent';

    const textColor = variant === 'primary' ? (off ? tokens.tertiary : tokens.bg) : off ? tokens.tertiary : tokens.accent;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={!!off}
            activeOpacity={0.85}
            style={{
                height: tokens.controlHeight,
                width: fullWidth ? '100%' : undefined,
                borderRadius: tokens.radius,
                backgroundColor: bg,
                borderWidth: 1,
                borderColor,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
            }}
        >
            {loading ? (
                <ActivityIndicator size="small" color={tokens.tertiary} />
            ) : (
                <Text
                    style={{
                        fontFamily: FONTS.extrabold,
                        fontSize: 14,
                        color: textColor,
                        letterSpacing: 1.7,
                        textTransform: 'uppercase',
                    }}
                >
                    {children}
                </Text>
            )}
        </TouchableOpacity>
    );
}
