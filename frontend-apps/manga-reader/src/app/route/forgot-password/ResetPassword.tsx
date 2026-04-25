import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AuthenticationForm from '@shared/component/form/AuthenticationForm';
import BaseInput from '@shared/component/input/BaseInput';
import RaisedButton from '@shared/component/button/RaisedButton';

import useResetPassword from '@feature/auth/hook/useResetPassword';

const ResetPassword = () => {
    const { t } = useTranslation('auth');
    const {
        token,
        password,
        confirmPassword,
        isLoading,
        errors,
        handlePasswordChange,
        handleConfirmPasswordChange,
        handleSubmit,
    } = useResetPassword();

    if (!token) {
        return (
            <>
                <Header showSearch={true} />
                <MainContent>
                    <section className="flex flex-col items-center justify-center gap-4 p-8 mx-auto mt-12 max-w-md text-center">
                        <h2 className="text-2xl font-bold text-shadow-default">
                            {t('resetPassword.invalidLinkTitle')}
                        </h2>
                        <p className="text-sm text-primary-default">
                            {t('resetPassword.invalidLinkMessage')}
                        </p>
                        <a
                            href="/Manga-Reader/forgot-password"
                            className="text-sm font-bold text-link hover:underline"
                        >
                            {t('resetPassword.requestNewLink')}
                        </a>
                    </section>
                </MainContent>
                <Footer showLinks={true} />
            </>
        );
    }

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <AuthenticationForm
                    onFormSubmit={handleSubmit}
                    title={t('resetPassword.title')}
                    helperText={t('resetPassword.helperText')}
                    link="/login"
                    linkText={t('resetPassword.linkText')}
                >
                    <BaseInput
                        label={t('resetPassword.passwordLabel')}
                        type="password"
                        placeholder={t('resetPassword.passwordPlaceholder')}
                        value={password}
                        onChange={handlePasswordChange}
                        disabled={isLoading}
                        error={errors.password}
                        name="password"
                    />
                    <BaseInput
                        label={t('resetPassword.confirmPasswordLabel')}
                        type="password"
                        placeholder={t(
                            'resetPassword.confirmPasswordPlaceholder',
                        )}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        disabled={isLoading}
                        error={errors.confirmPassword}
                        name="confirmPassword"
                    />
                    <RaisedButton
                        text={
                            isLoading
                                ? t('resetPassword.submitLoading')
                                : t('resetPassword.submit')
                        }
                    />
                </AuthenticationForm>
            </MainContent>
            <Footer showLinks={true} />
        </>
    );
};

export default ResetPassword;
