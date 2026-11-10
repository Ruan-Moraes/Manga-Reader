import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { AuthHeader, MRIcon, requestPasswordReset } from '@/features/authenticate';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { FONTS, useTheme } from '@/shared/theme';
import { AppText, Button, Card, Input, NavigationHeader, PageContainer, TextAction } from '@/shared/ui';

const MASCOT_PENSANDO = require('../../../../assets/images/mascot-pensando.png');
const SENT_ILLUSTRATION_SIZE = 132;
const TEXT_MAX_WIDTH = 320;

export function ForgotPage() {
    const { metrics, radii, spacing, tokens } = useTheme();
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
        const steps = [t('forgotPassword.sentStep1'), t('forgotPassword.sentStep2'), t('forgotPassword.sentStep3')];

        return (
            <PageContainer scroll>
                <View style={{ alignSelf: 'center', flex: 1, maxWidth: 440, paddingBottom: spacing.xl, paddingTop: spacing.sm, width: '100%' }}>
                    <NavigationHeader backLabel={t('forgotPassword.backToLoginLink')} onBack={() => navigateBackOrReplace(ROUTES.AUTH.LOGIN)} />
                    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg }}>
                        <Image
                            testID="forgot-sent-illustration"
                            accessible={false}
                            source={MASCOT_PENSANDO}
                            style={{ height: SENT_ILLUSTRATION_SIZE, width: SENT_ILLUSTRATION_SIZE }}
                            contentFit="contain"
                        />
                        <View
                            testID="forgot-sent-pill"
                            style={{
                                alignItems: 'center',
                                backgroundColor: tokens.accentSoft,
                                borderColor: tokens.accentBorder,
                                borderRadius: radii.pill,
                                borderWidth: 1,
                                flexDirection: 'row',
                                gap: spacing.xs,
                                minHeight: metrics.chip.value,
                                paddingHorizontal: spacing.md,
                            }}
                        >
                            <MRIcon name="send" size={metrics.icon.sm} color={tokens.accentText} />
                            <AppText variant="eyebrow" tone="accent">
                                {t('forgotPassword.sentEyebrow')}
                            </AppText>
                        </View>
                        <AppText accessibilityRole="header" variant="display" style={{ textAlign: 'center' }}>
                            {t('forgotPassword.sentTitle')}
                        </AppText>
                        <AppText tone="muted" style={{ maxWidth: TEXT_MAX_WIDTH, textAlign: 'center' }}>
                            {t('forgotPassword.sentSubtitle')}
                        </AppText>
                        <View style={{ alignItems: 'center', gap: spacing.xs }}>
                            <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                                {t('forgotPassword.sentLinkSentTo')}{' '}
                                <AppText variant="caption" style={{ fontFamily: FONTS.bold }}>
                                    {email.trim()}
                                </AppText>
                            </AppText>
                            <AppText variant="caption" tone="subtle" style={{ maxWidth: TEXT_MAX_WIDTH, textAlign: 'center' }}>
                                {expirationMinutes === null
                                    ? t('forgotPassword.sentExpiryUnknown')
                                    : t('forgotPassword.sentExpiry', { minutes: expirationMinutes })}
                            </AppText>
                        </View>
                    </View>
                    <View testID="forgot-next-steps">
                        <Card padded>
                            <View style={{ gap: spacing.md }}>
                                <AppText variant="label">{t('forgotPassword.sentNextSteps')}</AppText>
                                {steps.map((step, index) => (
                                    <View key={step} style={{ alignItems: 'center', flexDirection: 'row', gap: metrics.rhythm.itemGap }}>
                                        <View
                                            style={{
                                                alignItems: 'center',
                                                backgroundColor: tokens.accentSoft,
                                                borderRadius: radii.pill,
                                                height: metrics.chip.count,
                                                justifyContent: 'center',
                                                width: metrics.chip.count,
                                            }}
                                        >
                                            <AppText variant="caption" tone="accent" style={{ fontFamily: FONTS.bold }}>
                                                {String(index + 1)}
                                            </AppText>
                                        </View>
                                        <AppText variant="caption" style={{ flex: 1 }}>
                                            {step}
                                        </AppText>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    </View>
                    <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
                        <Button
                            leading={<MRIcon name="mail" size={metrics.icon.md} color={tokens.accentText} />}
                            disabled={cooldown > 0}
                            loading={loading}
                            onPress={() => void submit()}
                            variant="outline"
                        >
                            {cooldown > 0 ? `${t('forgotPassword.sentNotReceived')} ${cooldown}s` : t('forgotPassword.sentTryAgain')}
                        </Button>
                        <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' }}>
                            <AppText tone="muted">{t('forgotPassword.remembered')}</AppText>
                            <TextAction label={t('forgotPassword.backToLoginLink')} onPress={() => navigateBackOrReplace(ROUTES.AUTH.LOGIN)} />
                        </View>
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

                <Button onPress={() => void submit()} loading={loading}>
                    {t('forgotPassword.submitAction')}
                </Button>
            </View>
        </PageContainer>
    );
}
