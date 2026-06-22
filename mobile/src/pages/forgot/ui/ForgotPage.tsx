import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthFooter, AuthHeader, Field, GhostButton, MRIcon, PrimaryButton } from '@/src/features/auth';
import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

const MASCOT_PENSANDO = require('../../../../assets/images/mascot-pensando.png');

export function ForgotPage() {
    const { tokens } = useTheme();
    const { t } = useTranslation('auth');

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tick = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
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

    const submit = () => {
        if (loading) return;
        if (!email.trim() || !/.+@.+\..+/.test(email.trim())) {
            setError(t('forgotPassword.emailValidation'));
            return;
        }
        setError('');
        setLoading(true);
        timer.current = setTimeout(() => {
            setLoading(false);
            setSent(true);
            startCooldown();
        }, 700);
    };

    const retry = () => {
        setSent(false);
        setError('');
        setCooldown(0);
        if (tick.current) clearInterval(tick.current);
    };

    if (sent) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: tokens.bg,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: tokens.screenPadding,
                    paddingVertical: 24,
                }}
            >
                <View style={{ marginBottom: 20 }}>
                    <Image source={MASCOT_PENSANDO} style={{ width: 140, height: 140 }} contentFit="contain" />
                </View>

                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 7,
                        marginBottom: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        borderRadius: 999,
                        backgroundColor: `${tokens.accent}28`,
                        borderWidth: 1,
                        borderColor: `${tokens.accent}80`,
                    }}
                >
                    <MRIcon name="send" size={13} color={tokens.accent} />
                    <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11, color: tokens.accent, letterSpacing: 1.6, textTransform: 'uppercase' }}>
                        {t('forgotPassword.sentEyebrow')}
                    </Text>
                </View>

                <Text
                    style={{
                        fontFamily: FONTS.extrabold,
                        fontSize: 26,
                        color: tokens.text,
                        letterSpacing: tokens.ls,
                        lineHeight: 31,
                        textAlign: 'center',
                        marginBottom: 14,
                    }}
                >
                    {t('forgotPassword.sentTitle')}
                </Text>

                <Text
                    style={{
                        fontFamily: FONTS.regular,
                        fontSize: 13,
                        color: tokens.subtle,
                        letterSpacing: tokens.ls,
                        lineHeight: 21,
                        textAlign: 'center',
                        maxWidth: 300,
                        marginBottom: 28,
                    }}
                >
                    {t('forgotPassword.sentLinkSentTo')} <Text style={{ color: tokens.text, fontFamily: FONTS.bold }}>{email.trim()}</Text>
                    {'. '}
                    {t('forgotPassword.sentExpiry')}
                </Text>

                <View style={{ width: '100%', maxWidth: 340 }}>
                    <GhostButton icon="mail" disabled={cooldown > 0} onPress={startCooldown}>
                        {cooldown > 0 ? `${t('forgotPassword.sentNotReceived')} ${cooldown}s` : t('forgotPassword.sentTryAgain')}
                    </GhostButton>
                </View>

                <TouchableOpacity onPress={retry} style={{ marginTop: 18 }}>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: tokens.subtle, letterSpacing: tokens.ls }}>
                        {t('forgotPassword.remembered')}{' '}
                        <Text style={{ color: tokens.accent, fontFamily: FONTS.bold }}>{t('forgotPassword.backToLoginLink')}</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tokens.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: tokens.screenPadding, paddingTop: 58, paddingBottom: 36 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22, alignSelf: 'flex-start' }}
                >
                    <MRIcon name="arrow-left" size={18} color={tokens.subtle} />
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: tokens.subtle, letterSpacing: tokens.ls }}>
                        {t('forgotPassword.backToLoginLink')}
                    </Text>
                </TouchableOpacity>

                <AuthHeader layout="minimal" eyebrow={t('forgotPassword.eyebrow')} title={t('forgotPassword.title')} sub={t('forgotPassword.subtitle')} />

                <Field
                    label={t('forgotPassword.emailLabel')}
                    icon="mail"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={v => {
                        setEmail(v);
                        if (error) setError('');
                    }}
                    placeholder={t('forgotPassword.emailPlaceholder')}
                    error={error}
                    hint={t('forgotPassword.emailHint')}
                />

                <View style={{ height: 6 }} />
                <PrimaryButton onPress={submit} loading={loading}>
                    {t('forgotPassword.submitAction')}
                </PrimaryButton>

                <AuthFooter prompt={t('forgotPassword.remembered')} action={t('forgotPassword.backToLoginLink')} onAction={() => router.back()} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
