import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCheckbox, AuthFooter, AuthHeader, LegalLink, LegalLinkError, MRIcon, signUp, StrengthMeter, useLegalLinks } from '@/features/authenticate';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { AppText, Button, IconButton, Input, NavigationHeader, PageContainer } from '@/shared/ui';

/** MOB-FEAT-068: one `@`, no spaces and a dot in the domain; the server stays the final check. */
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
    const { metrics, spacing, tokens } = useTheme();
    const { t } = useTranslation('auth');
    const legal = useLegalLinks();

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
        else if (!EMAIL_FORMAT.test(email.trim())) next.email = t('validation.emailInvalid');
        if (!name.trim()) next.name = t('validation.nameRequired');
        if (pw.length < 8) next.pw = t('validation.passwordMin');
        // MOB-FEAT-068: the confirmation only complains once the password itself is valid.
        else if (!pw2) next.pw2 = t('validation.confirmPasswordRequired');
        else if (pw2 !== pw) next.pw2 = t('validation.passwordsDoNotMatch');
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
                    width: '100%',
                }}
            >
                <NavigationHeader backLabel={t('navigation.back')} onBack={() => navigateBackOrReplace(ROUTES.AUTH.LOGIN)} title={t('navigation.register')} />
                <AuthHeader eyebrow={t('signUp.eyebrow')} title={t('signUp.title')} sub={t('signUp.subtitle')} />

                <Input
                    label={t('signUp.emailLabel')}
                    leading={<MRIcon name="mail" size={18} color={tokens.tertiary} />}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    // Autofill hints: the password manager saves the new account (revisão 2026-11-13).
                    autoComplete="email"
                    textContentType="username"
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
                    autoComplete="name"
                    textContentType="name"
                    error={errors.name}
                />

                <Input
                    label={t('signUp.passwordLabel')}
                    leading={<MRIcon name="lock" size={18} color={tokens.tertiary} />}
                    secureTextEntry={!showPw}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    value={pw}
                    onChange={v => {
                        setPw(v);
                        clear('pw');
                    }}
                    placeholder={t('signUp.passwordPlaceholder')}
                    error={errors.pw}
                    trailing={
                        <IconButton
                            bare
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
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="go"
                    onSubmitEditing={() => void submit()}
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
                    {/* Only the policy names are links (revisão 2026-11-13); the rest of the sentence ticks the box. */}
                    {t('signUp.termsPrefix')} <LegalLink legal={legal} kind="terms" label={t('signUp.termsLinkLabel')} /> {t('signUp.termsAnd')}{' '}
                    <LegalLink legal={legal} kind="privacy" label={t('signUp.privacyLinkLabel')} />.
                </AuthCheckbox>

                {errors.terms && (
                    <View
                        accessibilityRole="alert"
                        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: -spacing.sm, marginBottom: spacing.md }}
                    >
                        <MRIcon name="alert" size={metrics.icon.sm} color={tokens.danger} />
                        <AppText variant="caption" tone="danger" style={{ flexShrink: 1 }}>
                            {errors.terms}
                        </AppText>
                    </View>
                )}

                <LegalLinkError legal={legal} />

                {errors.root && (
                    <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                        <MRIcon name="alert" size={metrics.icon.sm} color={tokens.danger} />
                        <AppText variant="caption" tone="danger" style={{ flexShrink: 1 }}>
                            {errors.root}
                        </AppText>
                    </View>
                )}

                <Button onPress={submit} loading={loading}>
                    {t('signUp.submit')}
                </Button>

                <AuthFooter prompt={t('signUp.noAccount')} action={t('signUp.loginLink')} onAction={() => navigateBackOrReplace(ROUTES.AUTH.LOGIN)} />
            </View>
        </PageContainer>
    );
}
