import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router, useGlobalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthFooter, AuthHeader, DemoCredentials, MRIcon, signIn } from '@/src/features/authenticate';
import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';
import { Button, Input } from '@/src/shared/ui';

export function LoginPage() {
    const params = useGlobalSearchParams<{ returnTo?: string | string[] }>();
    const { layout, minimumTouchTarget, spacing, tokens, typography } = useTheme();
    const { t } = useTranslation('auth');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (loading || !email.trim() || !password) return;
        setError('');
        setLoading(true);
        try {
            await signIn({ email: email.trim(), password });
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
                contentContainerStyle={{ paddingHorizontal: layout.screenGutter, paddingTop: spacing['2xl'], paddingBottom: spacing.xl }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <AuthHeader eyebrow={t('login.eyebrow')} title={t('login.title')} sub={t('login.subtitle')} />

                <Input
                    label={t('login.emailLabel')}
                    leading={<MRIcon name="mail" size={18} color={tokens.tertiary} />}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChange={v => {
                        setEmail(v);
                        if (error) setError('');
                    }}
                    placeholder={t('login.emailPlaceholder')}
                    error={error ? ' ' : ''}
                />

                <Input
                    label={t('login.passwordLabel')}
                    leading={<MRIcon name="lock" size={18} color={tokens.tertiary} />}
                    secureTextEntry={!showPw}
                    value={password}
                    onChange={v => {
                        setPassword(v);
                        if (error) setError('');
                    }}
                    placeholder={t('login.passwordPlaceholder')}
                    error={error}
                    labelAction={
                        <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() => router.push('/(auth)/forgot')}
                            style={{ alignItems: 'center', justifyContent: 'center', minHeight: minimumTouchTarget, paddingHorizontal: spacing.xs }}
                        >
                            <Text style={{ fontSize: typography.minimum, color: tokens.subtle, fontFamily: FONTS.regular }}>{t('login.forgotPassword')}</Text>
                        </TouchableOpacity>
                    }
                    trailing={
                        <TouchableOpacity
                            onPress={() => setShowPw(s => !s)}
                            accessibilityRole="button"
                            style={{
                                position: 'absolute',
                                right: 0,
                                minHeight: minimumTouchTarget,
                                minWidth: minimumTouchTarget,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <MRIcon name={showPw ? 'eye-off' : 'eye'} size={18} color={tokens.tertiary} />
                        </TouchableOpacity>
                    }
                />

                <View style={{ height: spacing.sm }} />
                <Button onPress={submit} loading={loading}>
                    {t('login.submit')}
                </Button>

                {__DEV__ && (
                    <DemoCredentials
                        onFill={(e, p) => {
                            setEmail(e);
                            setPassword(p);
                            setError('');
                        }}
                    />
                )}

                <AuthFooter
                    prompt={t('login.noAccount')}
                    action={t('login.signUpLink')}
                    onAction={() => router.push({ pathname: '/(auth)/register', params: { returnTo: params.returnTo } } as never)}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
