import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCheckbox, AuthFooter, AuthHeader, MRIcon, signUp, StrengthMeter } from '@/features/authenticate';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { FONTS, useTheme } from '@/shared/theme';
import { Button, IconButton, Input, NavigationHeader, PageContainer } from '@/shared/ui';

export function RegisterPage() {
    const { spacing, tokens, typography } = useTheme();
    const { t } = useTranslation('auth');

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [terms, setTerms] = useState(false);
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
        if (!pw2 || pw2 !== pw) next.pw2 = t('validation.passwordsDoNotMatch');
        if (!terms) next.terms = t('signUp.termsError');
        setErrors(next);
        if (Object.keys(next).length) return;

        setLoading(true);
        try {
            await signUp({ name: name.trim(), email: email.trim(), password: pw });
        } catch {
            setErrors({ root: t('signUp.createAccountError') });
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
                    paddingTop: spacing.sm,
                    width: '100%',
                }}
            >
                <NavigationHeader backLabel={t('navigation.back')} onBack={() => navigateBackOrReplace(ROUTES.AUTH.LOGIN)} />
                <AuthHeader eyebrow={t('signUp.eyebrow')} title={t('signUp.title')} sub={t('signUp.subtitle')} />

                <Input
                    label={t('signUp.emailLabel')}
                    leading={<MRIcon name="mail" size={18} color={tokens.tertiary} />}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChange={v => {
                        setEmail(v);
                        clear('email');
                    }}
                    placeholder={t('signUp.emailPlaceholder')}
                    error={errors.email}
                />

                <Input
                    label={t('signUp.nameLabel')}
                    leading={<MRIcon name="user" size={18} color={tokens.tertiary} />}
                    value={name}
                    onChange={v => {
                        setName(v);
                        clear('name');
                    }}
                    placeholder={t('signUp.namePlaceholder')}
                    autoCapitalize="words"
                    error={errors.name}
                />

                <Input
                    label={t('signUp.passwordLabel')}
                    leading={<MRIcon name="lock" size={18} color={tokens.tertiary} />}
                    secureTextEntry={!showPw}
                    value={pw}
                    onChange={v => {
                        setPw(v);
                        clear('pw');
                    }}
                    placeholder={t('signUp.passwordPlaceholder')}
                    error={errors.pw}
                    trailing={
                        <IconButton
                            icon={showPw ? 'eye-off-outline' : 'eye-outline'}
                            accessibilityLabel={showPw ? t('resetPassword.hidePassword') : t('resetPassword.showPassword')}
                            onPress={() => setShowPw(s => !s)}
                        />
                    }
                />
                {!errors.pw && <StrengthMeter value={pw} />}

                <Input
                    label={t('signUp.confirmPasswordLabel')}
                    leading={<MRIcon name="lock" size={18} color={tokens.tertiary} />}
                    secureTextEntry={!showPw}
                    value={pw2}
                    onChange={v => {
                        setPw2(v);
                        clear('pw2');
                    }}
                    placeholder={t('signUp.confirmPasswordPlaceholder')}
                    error={errors.pw2}
                />

                <View style={{ height: spacing.xs }} />

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
                            fontSize: typography.body,
                            color: errors.terms ? tokens.danger : tokens.muted,
                            letterSpacing: 0,
                            lineHeight: typography.body * 1.45,
                        }}
                    >
                        {t('signUp.termsPrefix')} {t('signUp.termsLinkLabel')} {t('signUp.termsAnd')} {t('signUp.privacyLinkLabel')}.
                    </Text>
                </AuthCheckbox>

                {errors.terms && (
                    <View
                        accessibilityRole="alert"
                        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: -spacing.sm, marginBottom: spacing.md }}
                    >
                        <MRIcon name="alert" size={13} color={tokens.danger} />
                        <Text style={{ fontSize: typography.minimum, color: tokens.danger, fontFamily: FONTS.regular }}>{errors.terms}</Text>
                    </View>
                )}

                {errors.root && (
                    <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                        <MRIcon name="alert" size={13} color={tokens.danger} />
                        <Text style={{ fontSize: typography.minimum, color: tokens.danger, fontFamily: FONTS.regular }}>{errors.root}</Text>
                    </View>
                )}

                <View style={{ height: spacing.sm }} />
                <Button onPress={submit} loading={loading}>
                    {t('signUp.submit')}
                </Button>

                <AuthFooter prompt={t('signUp.noAccount')} action={t('signUp.loginLink')} onAction={() => navigateBackOrReplace(ROUTES.AUTH.LOGIN)} />
            </View>
        </PageContainer>
    );
}
