import { Text, type TextProps } from 'react-native';

import { type TypographyStyleRole, useTheme } from '@/shared/theme';

type Tone = 'default' | 'muted' | 'subtle' | 'accent' | 'danger' | 'success' | 'inverse';

interface AppTextProps extends TextProps {
    variant?: TypographyStyleRole;
    tone?: Tone;
}

export function AppText({ variant = 'body', tone = 'default', style, ...props }: AppTextProps) {
    const { fontScale, textStyles, tokens } = useTheme();

    const colors: Record<Tone, string> = {
        default: tokens.text,
        muted: tokens.muted,
        subtle: tokens.subtle,
        accent: tokens.accentText,
        danger: tokens.danger,
        success: tokens.success,
        inverse: tokens.inverseText,
    };

    const typographyStyle = textStyles[variant];

    const fontSize = typographyStyle.fontSize ?? 14;
    const lineHeight = typographyStyle.lineHeight ?? fontSize * 1.4;

    return (
        <Text
            {...props}
            allowFontScaling={false}
            style={[
                typographyStyle,
                {
                    color: colors[tone],
                    fontSize: fontSize * fontScale,
                    lineHeight: lineHeight * fontScale,
                },
                style,
            ]}
        />
    );
}
