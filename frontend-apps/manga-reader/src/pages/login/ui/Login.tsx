import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth, AuthShell, AuthField, AuthSubmit } from '@features/auth';
import { REDIRECT_AFTER_LOGIN_KEY } from '@shared/constant/REDIRECT_AFTER_LOGIN_KEY';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { ROUTES } from '@shared/constant/ROUTES';

const DEMO_USER = {
    email: 'admin@mangareader.com',
    password: '123456',
} as const;

// Todo: Implementar o ZOD para validar e refatorar esse componente seguindo a lei da arquitera FSD e clean code.
const Login = () => {
    const navigate = useNavigate();

    const { t } = useTranslation('auth');

    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [loading, setLoading] = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();

        const errs: { email?: string; password?: string } = {};

        if (!email.trim()) {
            errs.email = t('login.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errs.email = t('login.emailInvalid');
        }

        if (!password) errs.password = t('login.passwordRequired');

        setErrors(errs);

        if (Object.keys(errs).length) return;

        setLoading(true);

        try {
            await login({ email: email.trim(), password });

            const redirectPath = localStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);

            if (redirectPath) {
                localStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
                navigate(redirectPath);
            } else {
                navigate(WEB_BASE_URL);
            }
        } catch {
            setErrors({
                password: t('login.invalidCredentials'),
            });
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = () => {
        setEmail(DEMO_USER.email);
        setPassword(DEMO_USER.password);
        setErrors({});
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
                        href={`${WEB_BASE_URL}${ROUTES.SIGN_UP}`}
                        onClick={go(`${WEB_BASE_URL}${ROUTES.SIGN_UP}`)}
                        className="font-mr-bold text-mr-accent tracking-mr no-underline"
                    >
                        {t('login.signUpLink')}
                    </a>
                </>
            }
        >
            <form onSubmit={submit} noValidate aria-label={t('login.formAria')}>
                <AuthField
                    label={t('login.emailLabel')}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('login.emailPlaceholder')}
                    error={errors.email}
                />

                <AuthField
                    label={t('login.passwordLabel')}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    error={errors.password}
                    rightSlot={
                        <a
                            href={`${WEB_BASE_URL}${ROUTES.FORGOT_PASSWORD}`}
                            onClick={go(`${WEB_BASE_URL}${ROUTES.FORGOT_PASSWORD}`)}
                            className="text-mr-tiny tracking-mr text-mr-fg-subtle no-underline hover:text-mr-fg"
                        >
                            {t('login.forgotPassword')}
                        </a>
                    }
                />

                <label className="mb-4 flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={e => setRemember(e.target.checked)}
                        className="size-3.5"
                        style={{ accentColor: '#ddda2a' }}
                    />
                    <span className="text-mr-small tracking-mr text-mr-gray-200">{t('login.rememberSession')}</span>
                </label>

                <AuthSubmit loading={loading}>{t('login.submit')}</AuthSubmit>

                {import.meta.env.DEV && (
                    <div
                        className="mt-4 rounded-mr-sm border border-dashed p-3.5"
                        style={{
                            background: 'rgba(221,218,42,0.06)',
                            borderColor: 'rgba(221,218,42,0.35)',
                        }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="mb-1.5 text-[10px] font-mr-extrabold uppercase tracking-[0.12em] text-mr-accent">{t('login.demoTitle')}</div>
                                <div className="font-mr-mono text-mr-small leading-relaxed text-mr-gray-200">
                                    <div>{DEMO_USER.email}</div>
                                    <div>{DEMO_USER.password}</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={fillDemo}
                                className="shrink-0 rounded-mr-xs border border-mr-accent bg-transparent px-2.5 py-1.5 text-[10px] font-mr-extrabold uppercase tracking-[0.1em] text-mr-accent"
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
