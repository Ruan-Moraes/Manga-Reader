import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AuthenticationForm from '@shared/component/form/AuthenticationForm';
import BaseInput from '@shared/component/input/BaseInput';
import RaisedButton from '@shared/component/button/RaisedButton';

import useForgotPassword from '@feature/auth/hook/useForgotPassword';

const ForgotPassword = () => {
    const { t } = useTranslation('auth');
    const {
        email,
        isLoading,
        isSubmitted,
        errors,
        handleEmailChange,
        handleSubmit,
    } = useForgotPassword();

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                {isSubmitted ? (
                    <section className="flex flex-col items-center justify-center max-w-md gap-4 mx-auto text-center">
                        <h2 className="text-2xl font-bold text-shadow-default">
                            {t('forgotPassword.submittedTitle')}
                        </h2>
                        <p className="text-sm">
                            {t('forgotPassword.submittedMessage')}
                        </p>
                        <a
                            href="/Manga-Reader/login"
                            className="text-sm font-bold text-link hover:underline"
                        >
                            {t('forgotPassword.backToLogin')}
                        </a>
                    </section>
                ) : (
                    <AuthenticationForm
                        onFormSubmit={handleSubmit}
                        title={t('forgotPassword.title')}
                        helperText={t('forgotPassword.helperText')}
                        link="/login"
                        linkText={t('forgotPassword.linkText')}
                    >
                        <BaseInput
                            label={t('forgotPassword.emailLabel')}
                            type="email"
                            placeholder={t('forgotPassword.emailPlaceholder')}
                            value={email}
                            onChange={handleEmailChange}
                            disabled={isLoading}
                            error={errors.email}
                            name="email"
                        />
                        <RaisedButton
                            text={
                                isLoading
                                    ? t('forgotPassword.submitLoading')
                                    : t('forgotPassword.submit')
                            }
                        />
                    </AuthenticationForm>
                )}
            </MainContent>
            <Footer showLinks={true} />
        </>
    );
};

export default ForgotPassword;
