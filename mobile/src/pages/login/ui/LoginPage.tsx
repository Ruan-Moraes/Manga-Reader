import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthCheckbox, AuthFooter, AuthHeader, authService, DemoCredentials, Field, MRIcon, PrimaryButton, SocialRow } from '@/src/features/auth';
import { useSessionStore } from '@/src/shared/store';
import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

export function LoginPage() {
    const login = useSessionStore(state => state.login);
    const { tokens } = useTheme();
    const { t } = useTranslation('auth');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (loading || !email.trim() || !password) return;
        setError('');
        setLoading(true);
        try {
            const result = await authService.login({ email: email.trim(), password });
            await login(result.user, { accessToken: result.accessToken, refreshToken: result.refreshToken });
            router.replace('/(tabs)');
        } catch {
            setError(t('login.invalidCredentials'));
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
                <AuthHeader eyebrow={t('login.eyebrow')} title={t('login.title')} sub={t('login.subtitle')} />

                <Field
                    label={t('login.emailLabel')}
                    icon="mail"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={v => {
                        setEmail(v);
                        if (error) setError('');
                    }}
                    placeholder={t('login.emailPlaceholder')}
                    error={error ? ' ' : ''}
                />

                <Field
                    label={t('login.passwordLabel')}
                    icon="lock"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={v => {
                        setPassword(v);
                        if (error) setError('');
                    }}
                    placeholder={t('login.passwordPlaceholder')}
                    error={error}
                    rightSlot={
                        <TouchableOpacity onPress={() => router.push('/(auth)/forgot')}>
                            <Text style={{ fontSize: 11, color: tokens.subtle, letterSpacing: tokens.ls, fontFamily: FONTS.regular }}>
                                {t('login.forgotPassword')}
                            </Text>
                        </TouchableOpacity>
                    }
                    trailing={
                        <TouchableOpacity
                            onPress={() => setShowPw(s => !s)}
                            style={{ position: 'absolute', right: 8, height: 36, width: 36, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <MRIcon name={showPw ? 'eye-off' : 'eye'} size={18} color={tokens.tertiary} />
                        </TouchableOpacity>
                    }
                />

                <AuthCheckbox checked={remember} onChange={() => setRemember(r => !r)}>
                    {t('login.rememberSession')}
                </AuthCheckbox>

                <View style={{ height: 6 }} />
                <PrimaryButton onPress={submit} loading={loading}>
                    {t('login.submit')}
                </PrimaryButton>

                <SocialRow />

                {__DEV__ && (
                    <DemoCredentials
                        onFill={(e, p) => {
                            setEmail(e);
                            setPassword(p);
                            setError('');
                        }}
                    />
                )}

                <AuthFooter prompt={t('login.noAccount')} action={t('login.signUpLink')} onAction={() => router.push('/(auth)/register')} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
