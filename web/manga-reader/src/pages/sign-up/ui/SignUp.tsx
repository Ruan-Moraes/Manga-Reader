import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth, AuthShell, AuthField, AuthSubmit, buildSignUpSchema, type SignUpFormValues } from '@features/auth';
import { WEB_BASE_URL, withWebBasePath } from '@shared/constant/WEB_BASE_URL';
import { ROUTES } from '@shared/constant/ROUTES';
import { showSuccessToast } from '@shared/service/util/toastService';

const STRENGTHS = [
    { level: 1, labelKey: 'passwordStrength.weak', color: '#ff784f' },
    { level: 2, labelKey: 'passwordStrength.medium', color: '#ddda2a' },
    { level: 3, labelKey: 'passwordStrength.strong', color: '#10b981' },
    { level: 4, labelKey: 'passwordStrength.great', color: '#10b981' },
] as const;

function calcStrength(password: string) {
    if (!password) return { level: 0 as const, labelKey: null, color: '#444' };
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return STRENGTHS[Math.max(0, s - 1)] ?? STRENGTHS[0];
}

const SignUp = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('auth');
    const { register: registerUser } = useAuth();

    const schema = useMemo(() => buildSignUpSchema(t), [t]);

    const {
        control,
        handleSubmit,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', email: '', password: '', accept: false },
    });

    const password = watch('password');
    const strength = useMemo(() => calcStrength(password), [password]);

    const onSubmit = async (values: SignUpFormValues) => {
        try {
            await registerUser({ name: values.name.trim(), email: values.email.trim(), password: values.password });

            showSuccessToast(t('signUp.success'));

            navigate(WEB_BASE_URL);
        } catch {
            setError('email', { message: t('signUp.createAccountError') });
        }
    };

    const go = (path: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(path);
    };

    return (
        <AuthShell
            eyebrow={t('signUp.eyebrow')}
            title={t('signUp.title')}
            subtitle={t('signUp.subtitle')}
            footer={
                <>
                    {t('signUp.noAccount')}{' '}
                    <a
                        href={withWebBasePath(ROUTES.LOGIN)}
                        onClick={go(withWebBasePath(ROUTES.LOGIN))}
                        className="font-mr-bold text-mr-accent tracking-mr no-underline"
                    >
                        {t('signUp.loginLink')}
                    </a>
                </>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label={t('signUp.formAria')}>
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <AuthField
                            label={t('signUp.nameLabel')}
                            autoComplete="name"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('signUp.namePlaceholder')}
                            error={errors.name?.message}
                        />
                    )}
                />

                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                        <AuthField
                            label={t('signUp.emailLabel')}
                            type="email"
                            autoComplete="email"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('signUp.emailPlaceholder')}
                            error={errors.email?.message}
                        />
                    )}
                />

                <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                        <AuthField
                            label={t('signUp.passwordLabel')}
                            type="password"
                            autoComplete="new-password"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('signUp.passwordPlaceholder')}
                            error={errors.password?.message}
                            rightSlot={
                                strength.labelKey ? (
                                    <span className="text-mr-tiny font-mr-bold tracking-mr" style={{ color: strength.color }}>
                                        {t(strength.labelKey)}
                                    </span>
                                ) : null
                            }
                        />
                    )}
                />

                {password && (
                    <div className="-mt-2 mb-3.5 flex gap-1" aria-hidden>
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className="h-[3px] flex-1 rounded-[1px] transition-colors duration-150"
                                style={{
                                    background: i <= strength.level ? strength.color : '#2a2a2a',
                                }}
                            />
                        ))}
                    </div>
                )}

                <Controller
                    name="accept"
                    control={control}
                    render={({ field }) => (
                        <label className="mb-2 flex cursor-pointer items-start gap-2">
                            <input
                                type="checkbox"
                                checked={field.value}
                                onChange={e => field.onChange(e.target.checked)}
                                className="mt-0.5 size-3.5 shrink-0"
                                style={{ accentColor: '#ddda2a' }}
                            />
                            <span className="text-mr-small leading-snug tracking-mr text-mr-gray-200">
                                {t('signUp.termsPrefix')}{' '}
                                <a href="/legal/terms" onClick={go('/legal/terms')} className="text-mr-accent no-underline">
                                    {t('signUp.termsLinkLabel')}
                                </a>{' '}
                                {t('signUp.termsAnd')}{' '}
                                <a href="/legal/privacy" onClick={go('/legal/privacy')} className="text-mr-accent no-underline">
                                    {t('signUp.privacyLinkLabel')}
                                </a>
                                .
                            </span>
                        </label>
                    )}
                />
                {errors.accept && (
                    <div className="mb-3.5 text-mr-tiny tracking-mr" style={{ color: '#ff784f' }}>
                        {errors.accept.message}
                    </div>
                )}

                <AuthSubmit loading={isSubmitting}>{t('signUp.submit')}</AuthSubmit>
            </form>
        </AuthShell>
    );
};

export default SignUp;
