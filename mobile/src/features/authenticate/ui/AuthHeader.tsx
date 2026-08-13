import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

const LOGO = require('../../../../assets/images/logo.png');

interface Props {
    layout?: 'mascote' | 'minimal';
    eyebrow?: string;
    title: string;
    sub?: string;
}

export function LogoMark({ size = 28 }: { size?: number }) {
    const { radii, tokens } = useTheme();
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: radii.sm,
                overflow: 'hidden',
                backgroundColor: tokens.logoBg,
                borderWidth: 0.5,
                borderColor: tokens.accentGlow,
            }}
        >
            <Image source={LOGO} style={{ width: size, height: size }} contentFit="cover" />
        </View>
    );
}

export function Wordmark({ fontSize = 16 }: { fontSize?: number }) {
    const { tokens } = useTheme();
    return (
        <Text
            style={{
                fontFamily: FONTS.extraboldItalic,
                fontSize,
                color: tokens.text,
                letterSpacing: 1.4,
                lineHeight: fontSize,
            }}
        >
            {'Manga '}
            <Text style={{ color: tokens.accentText }}>Reader</Text>
        </Text>
    );
}

export function AuthHeader({ layout = 'mascote', eyebrow, title, sub }: Props) {
    const { spacing, textStyles, tokens, typography } = useTheme();

    if (layout === 'minimal') {
        return (
            <View style={{ marginBottom: spacing.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing['2xl'] }}>
                    <LogoMark size={32} />
                    <Wordmark fontSize={16} />
                </View>
                {eyebrow && (
                    <Text
                        style={{
                            fontSize: typography.minimum,
                            fontFamily: FONTS.extrabold,
                            letterSpacing: 1.4,
                            textTransform: 'uppercase',
                            color: tokens.accentText,
                            marginBottom: spacing.sm,
                        }}
                    >
                        {eyebrow}
                    </Text>
                )}
                <Text
                    style={{
                        ...textStyles.display,
                        color: tokens.text,
                    }}
                >
                    {title}
                </Text>
                {sub && (
                    <Text
                        style={{
                            marginTop: spacing.sm,
                            ...textStyles.body,
                            color: tokens.subtle,
                            fontFamily: FONTS.regular,
                        }}
                    >
                        {sub}
                    </Text>
                )}
            </View>
        );
    }

    return (
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
                <LogoMark size={28} />
                <Wordmark fontSize={16} />
            </View>

            {eyebrow && (
                <Text
                    style={{
                        fontSize: typography.minimum,
                        fontFamily: FONTS.extrabold,
                        letterSpacing: 1.4,
                        textTransform: 'uppercase',
                        color: tokens.accentText,
                        marginBottom: spacing.sm,
                    }}
                >
                    {eyebrow}
                </Text>
            )}

            <Text
                style={{
                    ...textStyles.title,
                    fontFamily: FONTS.extrabold,
                    color: tokens.text,
                    textAlign: 'center',
                }}
            >
                {title}
            </Text>

            {sub && (
                <Text
                    style={{
                        marginTop: spacing.sm,
                        ...textStyles.body,
                        color: tokens.subtle,
                        textAlign: 'center',
                        maxWidth: 300,
                        fontFamily: FONTS.regular,
                    }}
                >
                    {sub}
                </Text>
            )}
        </View>
    );
}
