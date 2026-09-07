import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { AuthHeader, MRIcon, requestPasswordReset } from '@/features/authenticate';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { FONTS } from '@/shared/theme';
import { Button, Input, NavigationHeader, PageContainer } from '@/shared/ui';

const MASCOT_PENSANDO = require('../../../../assets/images/mascot-pensando.png');

export function ForgotPage() {
    const { minimumTouchTarget, radii, spacing, tokens, typography } = useTheme();
    const { t } = useTranslation('auth');

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [expirationMinutes, setExpirationMinutes] = useState<number | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const tick = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(
        () => () => {
            if (tick.current) clearInterval(tick.current);
        },
        [],
    );

    const startCooldown = () => {
        setCooldown(30);
        if (tick.current) clearInterval(tick.current);
        tick.current = setInterval(() => {
            setCooldown(c => {
                if (c <= 1) {
                    clearInterval(tick.current!);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
    };

    const submit = async () => {
        if (loading) return;
        if (!email.trim() || !/.+@.+\..+/.test(email.trim())) {
            setError(t('forgotPassword.emailValidation'));
            return;
        }
        setError('');
        setLoading(true);
        try {
            const result = await requestPasswordReset(email.trim());
            setExpirationMinutes(result.expiresInSeconds === null ? null : Math.max(1, Math.ceil(result.expiresInSeconds / 60)));
        } catch {
            // Always show success — never reveal if the account exists.
            setExpirationMinutes(null);
        } finally {
            setLoading(false);
            setSent(true);
            startCooldown();
        }
    };

    if (sent) {
        return (
            <PageContainer scroll>
                <View style={{ alignSelf: 'center', flex: 1, maxWidth: 440, paddingBottom: spacing.xl, paddingTop: spacing.sm, width: '100%' }}>
                    <NavigationHeader backLabel={t('forgotPassword.backToLoginLink')} onBack={() => navigateBackOrReplace(ROUTES.AUTH.LOGIN)} />
                    <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', paddingVertical: spacing.lg }}>
                        <View style={{ marginBottom: spacing.lg }}>
                            <Image source={MASCOT_PENSANDO} style={{ width: 140, height: 140 }} contentFit="contain" />
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: spacing.sm,
                                marginBottom: spacing.md,
                                paddingHorizontal: spacing.md,
                                paddingVertical: spacing.xs,
                                borderRadius: radii.pill,
                                backgroundColor: tokens.accentSoft,
                                borderWidth: 1,
                                borderColor: tokens.accentBorder,
                            }}
                        >
                            <MRIcon name="send" size={13} color={tokens.accentText} />
                            <Text
                                style={{
                                    fontFamily: FONTS.extrabold,
                                    fontSize: typography.minimum,
                                    color: tokens.accentText,
                                    letterSpacing: 1.6,
                                    textTransform: 'uppercase',
                                }}
                            >
                                {t('forgotPassword.sentEyebrow')}
                            </Text>
                        </View>

                        <Text
                            style={{
                                fontFamily: FONTS.extrabold,
                                fontSize: typography.h2,
                                color: tokens.text,
                                letterSpacing: 0,
                                lineHeight: typography.h2 * 1.2,
                                textAlign: 'center',
                                marginBottom: spacing.md,
                            }}
                        >
                            {t('forgotPassword.sentTitle')}
                        </Text>

                        <Text
                            style={{
                                fontFamily: FONTS.regular,
                                fontSize: typography.body,
                                color: tokens.subtle,
                                letterSpacing: 0,
                                lineHeight: typography.body * 1.45,
                                textAlign: 'center',
                                maxWidth: 300,
                                marginBottom: spacing.xl,
                            }}
                        >
                            {t('forgotPassword.sentLinkSentTo')} <Text style={{ color: tokens.text, fontFamily: FONTS.bold }}>{email.trim()}</Text>
                            {'. '}
                            {expirationMinutes === null
                                ? t('forgotPassword.sentExpiryUnknown')
                                : t('forgotPassword.sentExpiry', { minutes: expirationMinutes })}
                        </Text>

                        <View style={{ width: '100%', maxWidth: 340 }}>
                            <Button
                                leading={<MRIcon name="mail" size={20} color={tokens.accentText} />}
                                disabled={cooldown > 0}
                                loading={loading}
                                onPress={() => void submit()}
                                variant="outline"
                            >
                                {cooldown > 0 ? `${t('forgotPassword.sentNotReceived')} ${cooldown}s` : t('forgotPassword.sentTryAgain')}
                            </Button>
                        </View>

                        <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() => navigateBackOrReplace(ROUTES.AUTH.LOGIN)}
                            style={{ marginTop: spacing.lg, minHeight: minimumTouchTarget, justifyContent: 'center' }}
                        >
                            <Text style={{ fontFamily: FONTS.regular, fontSize: typography.body, color: tokens.subtle }}>
                                {t('forgotPassword.remembered')}{' '}
                                <Text style={{ color: tokens.accentText, fontFamily: FONTS.bold }}>{t('forgotPassword.backToLoginLink')}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </PageContainer>
        );
    }

    return (
        <PageContainer scroll>
            <View
                style={{
                    alignSelf: 'center',
                    maxWidth: 440,
                    paddingBottom: spacing.xl,
                    paddingTop: spacing.sm,
                    width: '100%',
                }}
            >
                <NavigationHeader backLabel={t('forgotPassword.backToLoginLink')} onBack={() => navigateBackOrReplace(ROUTES.AUTH.LOGIN)} />

                <AuthHeader layout="minimal" eyebrow={t('forgotPassword.eyebrow')} title={t('forgotPassword.title')} sub={t('forgotPassword.subtitle')} />

                <Input
                    label={t('forgotPassword.emailLabel')}
                    leading={<MRIcon name="mail" size={18} color={tokens.tertiary} />}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChange={v => {
                        setEmail(v);
                        if (error) setError('');
                    }}
                    placeholder={t('forgotPassword.emailPlaceholder')}
                    error={error}
                    helperText={t('forgotPassword.emailHint')}
                />

                <View style={{ height: spacing.sm }} />
                <Button onPress={() => void submit()} loading={loading}>
                    {t('forgotPassword.submitAction')}
                </Button>
            </View>
        </PageContainer>
    );
}
