import { Text, type TextProps } from 'react-native';

import { type TypographyStyleRole, useTheme } from '@/src/shared/theme';

type Tone = 'default' | 'muted' | 'subtle' | 'accent' | 'danger' | 'success' | 'inverse';

interface AppTextProps extends TextProps {
    variant?: TypographyStyleRole;
    tone?: Tone;
}

export function AppText({ variant = 'body', tone = 'default', style, ...props }: AppTextProps) {
    const { textStyles, tokens } = useTheme();
    const colors: Record<Tone, string> = {
        default: tokens.text,
        muted: tokens.muted,
        subtle: tokens.subtle,
        accent: tokens.accentText,
        danger: tokens.danger,
        success: tokens.success,
        inverse: tokens.inverseText,
    };

    return <Text {...props} style={[textStyles[variant], { color: colors[tone] }, style]} />;
}
