import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthCheckbox, AuthFooter, AuthHeader, authService, Field, MRIcon, PrimaryButton, StrengthMeter } from '@/src/features/auth';
import { useSessionStore } from '@/src/shared/store';
import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

export function RegisterPage() {
    const login = useSessionStore(state => state.login);
    const { tokens } = useTheme();
    const { t } = useTranslation('auth');

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [terms, setTerms] = useState(false);
    const [news, setNews] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const clear = (k: string) => {
        if (errors[k])
            setErrors(p => {
                const n = { ...p };
                delete n[k];
                return n;
            });
    };

    const submit = async () => {
        if (loading) return;
        const next: Record<string, string> = {};
        if (!email.trim()) next.email = t('validation.emailRequired');
        if (!name.trim()) next.name = t('validation.nameRequired');
        if (pw.length < 8) next.pw = t('validation.passwordMin');
        if (pw2 && pw2 !== pw) next.pw2 = t('validation.passwordsDoNotMatch');
        if (!terms) next.terms = t('signUp.termsError');
        setErrors(next);
        if (Object.keys(next).length) return;

        setLoading(true);
        try {
            const result = await authService.register({ name: name.trim(), email: email.trim(), password: pw });
            await login(result.user, { accessToken: result.accessToken, refreshToken: result.refreshToken });
            router.replace('/(tabs)');
        } catch {
            setErrors({ root: t('signUp.createAccountError') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tokens.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: tokens.screenPadding, paddingTop: 58, paddingBottom: 36 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <AuthHeader eyebrow={t('signUp.eyebrow')} title={t('signUp.title')} sub={t('signUp.subtitle')} />

                <Field
                    label={t('signUp.emailLabel')}
                    icon="mail"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={v => {
                        setEmail(v);
                        clear('email');
                    }}
                    placeholder={t('signUp.emailPlaceholder')}
                    error={errors.email}
                />

                <Field
                    label={t('signUp.nameLabel')}
                    icon="user"
                    value={name}
                    onChange={v => {
                        setName(v);
                        clear('name');
                    }}
                    placeholder={t('signUp.namePlaceholder')}
                    autoCapitalize="words"
                    error={errors.name}
                />

                <Field
                    label={t('signUp.passwordLabel')}
                    icon="lock"
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={v => {
                        setPw(v);
                        clear('pw');
                    }}
                    placeholder={t('signUp.passwordPlaceholder')}
                    error={errors.pw}
                    trailing={
                        <TouchableOpacity
                            onPress={() => setShowPw(s => !s)}
                            style={{ position: 'absolute', right: 8, height: 36, width: 36, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <MRIcon name={showPw ? 'eye-off' : 'eye'} size={18} color={tokens.tertiary} />
                        </TouchableOpacity>
                    }
                />
                {!errors.pw && <StrengthMeter value={pw} />}

                <Field
                    label={t('signUp.confirmPasswordLabel')}
                    icon="lock"
                    type={showPw ? 'text' : 'password'}
                    value={pw2}
                    onChange={v => {
                        setPw2(v);
                        clear('pw2');
                    }}
                    placeholder={t('signUp.confirmPasswordPlaceholder')}
                    error={errors.pw2}
                />

                <View style={{ height: 4 }} />

                <AuthCheckbox
                    checked={terms}
                    onChange={() => {
                        setTerms(prev => !prev);
                        clear('terms');
                    }}
                    error={errors.terms}
                >
                    <Text
                        style={{
                            fontFamily: FONTS.regular,
                            fontSize: 13,
                            color: errors.terms ? tokens.danger : tokens.muted,
                            letterSpacing: tokens.ls,
                            lineHeight: 19,
                        }}
                    >
                        {t('signUp.termsPrefix')} <Text style={{ color: tokens.accent, fontFamily: FONTS.bold }}>{t('signUp.termsLinkLabel')}</Text>{' '}
                        {t('signUp.termsAnd')} <Text style={{ color: tokens.accent, fontFamily: FONTS.bold }}>{t('signUp.privacyLinkLabel')}</Text>.
                    </Text>
                </AuthCheckbox>

                {errors.terms && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: 12 }}>
                        <MRIcon name="alert" size={13} color={tokens.danger} />
                        <Text style={{ fontSize: 11, color: tokens.danger, letterSpacing: tokens.ls, fontFamily: FONTS.regular }}>{errors.terms}</Text>
                    </View>
                )}

                <AuthCheckbox checked={news} onChange={() => setNews(n => !n)}>
                    {t('signUp.newsletterOptIn')}
                </AuthCheckbox>

                {errors.root && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <MRIcon name="alert" size={13} color={tokens.danger} />
                        <Text style={{ fontSize: 11, color: tokens.danger, letterSpacing: tokens.ls, fontFamily: FONTS.regular }}>{errors.root}</Text>
                    </View>
                )}

                <View style={{ height: 6 }} />
                <PrimaryButton onPress={submit} loading={loading}>
                    {t('signUp.submit')}
                </PrimaryButton>

                <AuthFooter prompt={t('signUp.noAccount')} action={t('signUp.loginLink')} onAction={() => router.back()} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
