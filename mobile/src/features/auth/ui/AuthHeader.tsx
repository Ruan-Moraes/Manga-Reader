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
    const { tokens } = useTheme();
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: tokens.radius,
                overflow: 'hidden',
                backgroundColor: '#000',
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
            <Text style={{ color: tokens.accent }}>Reader</Text>
        </Text>
    );
}

export function AuthHeader({ layout = 'mascote', eyebrow, title, sub }: Props) {
    const { tokens } = useTheme();

    if (layout === 'minimal') {
        return (
            <View style={{ marginBottom: 28 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                    <LogoMark size={32} />
                    <Wordmark fontSize={16} />
                </View>
                {eyebrow && (
                    <Text
                        style={{
                            fontSize: 11,
                            fontFamily: FONTS.extrabold,
                            letterSpacing: 1.4,
                            textTransform: 'uppercase',
                            color: tokens.accent,
                            marginBottom: 8,
                        }}
                    >
                        {eyebrow}
                    </Text>
                )}
                <Text style={{ fontSize: 30, fontFamily: FONTS.extrabold, lineHeight: 35, letterSpacing: tokens.ls, color: tokens.text }}>{title}</Text>
                {sub && (
                    <Text style={{ marginTop: 10, fontSize: 13, lineHeight: 20, color: tokens.subtle, letterSpacing: tokens.ls, fontFamily: FONTS.regular }}>
                        {sub}
                    </Text>
                )}
            </View>
        );
    }

    return (
        <View style={{ alignItems: 'center', marginBottom: 26 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 }}>
                <LogoMark size={28} />
                <Wordmark fontSize={16} />
            </View>

            {eyebrow && (
                <Text
                    style={{
                        fontSize: 11,
                        fontFamily: FONTS.extrabold,
                        letterSpacing: 1.4,
                        textTransform: 'uppercase',
                        color: tokens.accent,
                        marginBottom: 8,
                    }}
                >
                    {eyebrow}
                </Text>
            )}

            <Text
                style={{
                    fontSize: 26,
                    fontFamily: FONTS.extrabold,
                    lineHeight: 30,
                    letterSpacing: tokens.ls,
                    color: tokens.text,
                    textAlign: 'center',
                }}
            >
                {title}
            </Text>

            {sub && (
                <Text
                    style={{
                        marginTop: 10,
                        fontSize: 13,
                        lineHeight: 20,
                        color: tokens.subtle,
                        letterSpacing: tokens.ls,
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
