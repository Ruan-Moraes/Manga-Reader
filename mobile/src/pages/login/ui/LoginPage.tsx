import { useState } from 'react';
import { View } from 'react-native';
import { router, useGlobalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthFooter, AuthHeader, DemoCredentials, MRIcon, signIn, SignInLegalNotice } from '@/features/authenticate';
import { useDeveloperModeEnabled } from '@/shared/config';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { Button, IconButton, Input, NavigationHeader, PageContainer, TextAction } from '@/shared/ui';

export function LoginPage() {
    const developerModeEnabled = useDeveloperModeEnabled();
    const params = useGlobalSearchParams<{ returnTo?: string | string[] }>();

    const { spacing, tokens } = useTheme();

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
        <PageContainer scroll>
            <View
                style={{
                    alignSelf: 'center',
                    maxWidth: 440,
                    paddingBottom: spacing.xl,
                    width: '100%',
                }}
            >
                <NavigationHeader backLabel={t('navigation.back')} onBack={() => navigateBackOrReplace(ROUTES.ROOT)} title={t('navigation.login')} />
                <AuthHeader artwork eyebrow={t('login.eyebrow')} title={t('login.title')} sub={t('login.subtitle')} />
                <Input
                    label={t('login.emailLabel')}
                    leading={<MRIcon name="mail" size={18} color={tokens.tertiary} />}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    // Lets the system password manager offer saved accounts (revisão 2026-11-13).
                    autoComplete="email"
                    textContentType="username"
                    value={email}
                    onChange={v => {
                        setEmail(v);
                        if (error) setError('');
                    }}
                    placeholder={t('login.emailPlaceholder')}
                    invalid={Boolean(error)}
                />

                <Input
                    label={t('login.passwordLabel')}
                    leading={<MRIcon name="lock" size={18} color={tokens.tertiary} />}
                    secureTextEntry={!showPw}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={() => void submit()}
                    value={password}
                    onChange={v => {
                        setPassword(v);
                        if (error) setError('');
                    }}
                    placeholder={t('login.passwordPlaceholder')}
                    error={error}
                    labelAction={<TextAction label={t('login.forgotPassword')} onPress={() => router.push('/(auth)/forgot')} />}
                    trailing={
                        <IconButton
                            bare
                            icon={showPw ? 'eye-off-outline' : 'eye-outline'}
                            accessibilityLabel={showPw ? t('resetPassword.hidePassword') : t('resetPassword.showPassword')}
                            onPress={() => setShowPw(s => !s)}
                        />
                    }
                />

                <Button onPress={submit} loading={loading} disabled={!email.trim() || !password}>
                    {t('login.submit')}
                </Button>
                <SignInLegalNotice />

                {__DEV__ && developerModeEnabled && (
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
            </View>
        </PageContainer>
    );
}
