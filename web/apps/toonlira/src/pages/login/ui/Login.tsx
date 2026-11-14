import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth, AuthShell, AuthField, AuthSubmit, buildLoginSchema, type LoginFormValues } from '@features/auth';
import { REDIRECT_AFTER_LOGIN_KEY } from '@shared/constant/REDIRECT_AFTER_LOGIN_KEY';
import { WEB_BASE_URL, withWebBasePath } from '@shared/constant/WEB_BASE_URL';
import { ROUTES } from '@shared/constant/ROUTES';

const DEMO_USER = {
    email: 'admin@toonlira.com',
    password: '123456',
} as const;

const Login = () => {
    const navigate = useNavigate();

    const { t } = useTranslation('auth');

    const { login } = useAuth();

    const [remember, setRemember] = useState(true);

    const schema = useMemo(() => buildLoginSchema(t), [t]);

    const {
        control,
        handleSubmit,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (values: LoginFormValues) => {
        try {
            await login({ email: values.email.trim(), password: values.password });

            const redirectPath = localStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);

            if (redirectPath) {
                localStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
                navigate(redirectPath);
            } else {
                navigate(WEB_BASE_URL);
            }
        } catch {
            setError('password', { message: t('login.invalidCredentials') });
        }
    };

    const fillDemo = () => {
        setValue('email', DEMO_USER.email, { shouldValidate: false });
        setValue('password', DEMO_USER.password, { shouldValidate: false });
    };

    const go = (path: string) => (e: React.MouseEvent) => {
        e.preventDefault();

        navigate(path);
    };

    return (
        <AuthShell
            eyebrow={t('login.eyebrow')}
            title={t('login.title')}
            subtitle={t('login.subtitle')}
            footer={
                <>
                    {t('login.noAccount')}{' '}
                    <a
                        href={withWebBasePath(ROUTES.SIGN_UP)}
                        onClick={go(withWebBasePath(ROUTES.SIGN_UP))}
                        className="font-ui-bold text-ui-accent-fg tracking-mr no-underline"
                    >
                        {t('login.signUpLink')}
                    </a>
                </>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label={t('login.formAria')}>
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                        <AuthField
                            label={t('login.emailLabel')}
                            type="email"
                            autoComplete="email"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('login.emailPlaceholder')}
                            error={errors.email?.message}
                        />
                    )}
                />

                <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                        <AuthField
                            label={t('login.passwordLabel')}
                            type="password"
                            autoComplete="current-password"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('login.passwordPlaceholder')}
                            error={errors.password?.message}
                            rightSlot={
                                <a
                                    href={withWebBasePath(ROUTES.FORGOT_PASSWORD)}
                                    onClick={go(withWebBasePath(ROUTES.FORGOT_PASSWORD))}
                                    className="text-ui-tiny tracking-mr text-ui-fg-subtle no-underline hover:text-ui-fg"
                                >
                                    {t('login.forgotPassword')}
                                </a>
                            }
                        />
                    )}
                />

                <label className="mb-4 flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={e => setRemember(e.target.checked)}
                        className="size-3.5"
                        style={{ accentColor: 'var(--ui-accent)' }}
                    />
                    <span className="text-ui-small tracking-mr text-ui-gray-200">{t('login.rememberSession')}</span>
                </label>

                <AuthSubmit loading={isSubmitting}>{t('login.submit')}</AuthSubmit>

                {import.meta.env.DEV && (
                    <div className="mt-4 rounded-ui-sm border border-dashed border-ui-accent-border/50 bg-ui-accent/10 p-3.5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="mb-1.5 text-[10px] font-ui-extrabold uppercase tracking-[0.12em] text-ui-accent-fg">{t('login.demoTitle')}</div>
                                <div className="font-ui-mono text-ui-small leading-relaxed text-ui-gray-200">
                                    <div>{DEMO_USER.email}</div>
                                    <div>{DEMO_USER.password}</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={fillDemo}
                                className="shrink-0 rounded-ui-xs border border-ui-accent-border bg-transparent px-2.5 py-1.5 text-[10px] font-ui-extrabold uppercase tracking-[0.1em] text-ui-accent-fg"
                            >
                                {t('login.demoFill')}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </AuthShell>
    );
};

export default Login;
