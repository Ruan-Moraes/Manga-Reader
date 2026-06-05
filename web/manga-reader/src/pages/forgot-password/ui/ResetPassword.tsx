import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';

import { useResetPassword, AuthShell, AuthField, AuthSubmit } from '@features/auth';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { ROUTES } from '@shared/constant/ROUTES';
import { EmptyState } from '@ui/EmptyState';
import { Button } from '@ui/Button';

const STRENGTHS = [
    { level: 1, labelKey: 'passwordStrength.weak', color: '#ff784f' },
    { level: 2, labelKey: 'passwordStrength.medium', color: '#ddda2a' },
    { level: 3, labelKey: 'passwordStrength.strong', color: '#10b981' },
    { level: 4, labelKey: 'passwordStrength.great', color: '#10b981' },
] as const;

function calcStrength(pw: string) {
    if (!pw) return { level: 0 as const, labelKey: null, color: '#444' };
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return STRENGTHS[Math.max(0, s - 1)] ?? STRENGTHS[0];
}

const ResetPassword = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('auth');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { token, password, confirmPassword, isLoading, errors, handlePasswordChange, handleConfirmPasswordChange, handleSubmit } = useResetPassword();

    const strength = useMemo(() => calcStrength(password), [password]);

    const go = (path: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(path);
    };

    if (!token) {
        return (
            <AuthShell
                eyebrow={t('resetPassword.eyebrow')}
                title={t('resetPassword.invalidLinkTitle')}
                subtitle={t('resetPassword.invalidLinkSubtitle')}
                footer={
                    <>
                        {t('resetPassword.invalidLinkFooter')}{' '}
                        <a
                            href={`${WEB_BASE_URL}${ROUTES.LOGIN}`}
                            onClick={go(`${WEB_BASE_URL}${ROUTES.LOGIN}`)}
                            className="font-mr-bold text-mr-accent tracking-mr no-underline"
                        >
                            {t('resetPassword.invalidLinkBack')}
                        </a>
                    </>
                }
            >
                <EmptyState
                    illustration="triste"
                    title=""
                    description=""
                    action={
                        <Button variant="primary" onClick={() => navigate(`${WEB_BASE_URL}${ROUTES.FORGOT_PASSWORD}`)} className="w-full">
                            {t('resetPassword.requestNewLink')}
                        </Button>
                    }
                />
            </AuthShell>
        );
    }

    return (
        <AuthShell
            eyebrow={t('resetPassword.eyebrow')}
            title={t('resetPassword.validTitle')}
            subtitle={t('resetPassword.validSubtitle')}
            footer={
                <>
                    {t('resetPassword.footer')}{' '}
                    <a
                        href={`${WEB_BASE_URL}${ROUTES.LOGIN}`}
                        onClick={go(`${WEB_BASE_URL}${ROUTES.LOGIN}`)}
                        className="font-mr-bold text-mr-accent tracking-mr no-underline"
                    >
                        {t('resetPassword.backToLoginLink')}
                    </a>
                </>
            }
        >
            <form onSubmit={handleSubmit} noValidate aria-label={t('resetPassword.formAria')}>
                <AuthField
                    label={t('resetPassword.newPasswordLabel')}
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder={t('resetPassword.newPasswordPlaceholder')}
                    error={errors.password}
                    rightSlot={
                        <button
                            type="button"
                            onClick={() => setShowPw(v => !v)}
                            aria-label={showPw ? t('resetPassword.hidePassword') : t('resetPassword.showPassword')}
                            className="text-mr-tiny text-mr-fg-subtle hover:text-mr-fg"
                        >
                            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    }
                />

                {password && (
                    <div className="-mt-2 mb-3.5 flex items-center gap-2">
                        <div className="flex flex-1 gap-1" aria-hidden>
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
                        {strength.labelKey && (
                            <span className="shrink-0 text-mr-tiny font-mr-bold tracking-mr" style={{ color: strength.color }}>
                                {t(strength.labelKey)}
                            </span>
                        )}
                    </div>
                )}

                <AuthField
                    label={t('resetPassword.confirmPasswordLabel')}
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                    error={errors.confirmPassword}
                    rightSlot={
                        <button
                            type="button"
                            onClick={() => setShowConfirm(v => !v)}
                            aria-label={showConfirm ? t('resetPassword.hidePassword') : t('resetPassword.showPassword')}
                            className="text-mr-tiny text-mr-fg-subtle hover:text-mr-fg"
                        >
                            {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    }
                />

                <AuthSubmit loading={isLoading}>{t('resetPassword.submitAction')}</AuthSubmit>
            </form>
        </AuthShell>
    );
};

export default ResetPassword;
