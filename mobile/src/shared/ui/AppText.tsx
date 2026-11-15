import { Text, type TextProps } from 'react-native';

import { type TypographyStyleRole, useTheme } from '@/shared/theme';

type Tone = 'default' | 'muted' | 'subtle' | 'accent' | 'danger' | 'success' | 'inverse';

/**
 * Headings are already large: past 2× the system font they break mid-word on a phone. Body text keeps scaling
 * freely; 200% (MOB-FEAT-057/AC-014) stays intact for every role.
 */
const HEADING_MAX_FONT_SCALE = 2;
const CAPPED_ROLES: ReadonlySet<TypographyStyleRole> = new Set(['display', 'title']);

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
    const scale = CAPPED_ROLES.has(variant) ? Math.min(fontScale, HEADING_MAX_FONT_SCALE) : fontScale;

    return (
        <Text
            {...props}
            allowFontScaling={false}
            style={[
                typographyStyle,
                {
                    color: colors[tone],
                    fontSize: fontSize * scale,
                    lineHeight: lineHeight * scale,
                },
                style,
            ]}
        />
    );
}
