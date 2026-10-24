import { useState } from 'react';
import { View } from 'react-native';
import { router, useGlobalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthFooter, AuthHeader, DemoCredentials, MRIcon, signIn } from '@/features/authenticate';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { Button, IconButton, Input, NavigationHeader, PageContainer } from '@/shared/ui';

export function LoginPage() {
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
                    paddingTop: spacing.sm,
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
                    trailing={
                        <IconButton
                            icon={showPw ? 'eye-off-outline' : 'eye-outline'}
                            accessibilityLabel={showPw ? t('resetPassword.hidePassword') : t('resetPassword.showPassword')}
                            onPress={() => setShowPw(s => !s)}
                        />
                    }
                />

                <View style={{ height: spacing.sm }} />
                <Button onPress={submit} loading={loading} disabled={!email.trim() || !password}>
                    {t('login.submit')}
                </Button>

                <Button size="compact" fullWidth={false} variant="ghost" onPress={() => router.push('/(auth)/forgot')}>
                    {t('login.forgotPassword')}
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
            </View>
        </PageContainer>
    );
}
