import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { requestPasswordReset, AuthShell, AuthField, AuthSubmit } from '@feature/auth';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { ROUTES } from '@shared/constant/ROUTES';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('auth');

    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!EMAIL_RE.test(email.trim())) {
            setError(t('forgotPassword.emailValidation'));
            return;
        }
        setLoading(true);
        try {
            await requestPasswordReset(email.trim());
        } catch {
            // Always show success — never reveal if email is registered
        } finally {
            setSent(true);
            setLoading(false);
        }
    };

    const go = (path: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(path);
    };

    if (sent) {
        return (
            <AuthShell
                eyebrow={t('forgotPassword.sentEyebrow')}
                title={t('forgotPassword.sentTitle')}
                subtitle={t('forgotPassword.sentSubtitle')}
                footer={
                    <>
                        {t('forgotPassword.sentNotReceived')}{' '}
                        <a
                            href="#"
                            onClick={e => {
                                e.preventDefault();
                                setSent(false);
                            }}
                            className="font-mr-bold text-mr-accent tracking-mr no-underline"
                        >
                            {t('forgotPassword.sentTryAgain')}
                        </a>
                        {' · '}
                        <a
                            href={`${WEB_BASE_URL}${ROUTES.LOGIN}`}
                            onClick={go(`${WEB_BASE_URL}${ROUTES.LOGIN}`)}
                            className="font-mr-bold text-mr-accent tracking-mr no-underline"
                        >
                            {t('forgotPassword.backToLoginLink')}
                        </a>
                    </>
                }
            >
                {/* Success card */}
                <div
                    className="flex items-start gap-3.5 rounded-mr-sm p-5"
                    style={{
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.35)',
                    }}
                >
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-mr-xs text-[18px]"
                        style={{
                            background: 'rgba(16,185,129,0.18)',
                            color: '#10b981',
                        }}
                        aria-hidden
                    >
                        ✓
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 text-[13px] font-mr-bold tracking-mr text-mr-fg">
                            {t('forgotPassword.sentLinkSentTo')} <span className="text-mr-accent">{email}</span>
                        </div>
                        <div className="text-mr-small leading-relaxed text-mr-gray-200">{t('forgotPassword.sentExpiry')}</div>
                    </div>
                </div>

                {/* Next steps */}
                <div className="mt-4">
                    <div className="mb-2 text-mr-tiny font-mr-extrabold uppercase tracking-[0.12em] text-mr-accent">{t('forgotPassword.sentNextSteps')}</div>
                    <ol className="m-0 list-decimal pl-5 text-[13px] leading-[1.7] text-mr-gray-200">
                        <li>{t('forgotPassword.sentStep1')}</li>
                        <li>{t('forgotPassword.sentStep2')}</li>
                        <li>{t('forgotPassword.sentStep3')}</li>
                    </ol>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            eyebrow={t('forgotPassword.eyebrow')}
            title={t('forgotPassword.title')}
            subtitle={t('forgotPassword.subtitle')}
            footer={
                <>
                    {t('forgotPassword.remembered')}{' '}
                    <a
                        href={`${WEB_BASE_URL}${ROUTES.LOGIN}`}
                        onClick={go(`${WEB_BASE_URL}${ROUTES.LOGIN}`)}
                        className="font-mr-bold text-mr-accent tracking-mr no-underline"
                    >
                        {t('forgotPassword.backToLoginLink')}
                    </a>
                </>
            }
        >
            <form onSubmit={submit} noValidate aria-label={t('forgotPassword.formAria')}>
                <AuthField
                    label={t('forgotPassword.emailLabel')}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('forgotPassword.emailPlaceholder')}
                    hint={t('forgotPassword.emailHint')}
                    error={error}
                />
                <AuthSubmit loading={loading}>{t('forgotPassword.submitAction')}</AuthSubmit>
            </form>
        </AuthShell>
    );
};

export default ForgotPassword;
