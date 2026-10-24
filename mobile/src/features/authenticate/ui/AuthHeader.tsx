import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';
import { FONTS } from '@/shared/theme';

const LOGIN_HERO = require('../../../../assets/images/login-hero.png');
const LOGIN_HERO_LIGHT = require('../../../../assets/images/login-hero-light.png');

interface Props {
    layout?: 'mascote' | 'minimal';
    artwork?: boolean;
    eyebrow?: string;
    title: string;
    sub?: string;
}

export function AuthHeader({ layout = 'mascote', artwork = false, eyebrow, title, sub }: Props) {
    const { t } = useTranslation('auth');
    const { colorScheme, radii, spacing, textStyles, tokens, typography } = useTheme();

    if (layout === 'minimal') {
        return (
            <View style={{ marginBottom: spacing.lg }}>
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
            {artwork ? (
                <View
                    accessibilityElementsHidden
                    style={{
                        alignItems: 'center',
                        backgroundColor: tokens.accent,
                        borderColor: tokens.borderStrong,
                        borderRadius: radii.control,
                        borderWidth: 1,
                        height: 152,
                        justifyContent: 'center',
                        marginBottom: spacing.xl,
                        overflow: 'hidden',
                        width: '100%',
                    }}
                >
                    <Image
                        accessibilityLabel={t('artwork.libraryDoor')}
                        source={colorScheme === 'light' ? LOGIN_HERO_LIGHT : LOGIN_HERO}
                        style={{ height: '100%', position: 'absolute', width: '100%' }}
                        contentFit="cover"
                    />
                </View>
            ) : null}

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
                        maxWidth: 340,
                        fontFamily: FONTS.regular,
                    }}
                >
                    {sub}
                </Text>
            )}
        </View>
    );
}
