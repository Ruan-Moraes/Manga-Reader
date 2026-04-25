import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
    showErrorToast,
    showInfoToast,
    showSuccessToast,
} from '@shared/service/util/toastService';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AuthenticationForm from '@shared/component/form/AuthenticationForm';
import BaseInput from '@shared/component/input/BaseInput';
import RaisedButton from '@shared/component/button/RaisedButton';

import { useAuth } from '@feature/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
    email?: string;
    password?: string;
};

const Login = () => {
    const { t } = useTranslation('auth');
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [redirectPath, setRedirectPath] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    const { login } = useAuth();

    useEffect(() => {
        const storedPath = localStorage.getItem('redirectAfterLogin');

        if (storedPath) {
            setRedirectPath(storedPath);

            showInfoToast(t('login.redirectInfo'), {
                toastId: 'redirect-info',
            });
        }
    }, [t]);

    const validate = useCallback((): FormErrors => {
        const newErrors: FormErrors = {};

        if (!email.trim()) {
            newErrors.email = t('validation.emailRequired');
        }

        if (!EMAIL_REGEX.test(email.trim())) {
            newErrors.email = t('validation.emailInvalid');
        }

        if (!password) {
            newErrors.password = t('validation.passwordRequired');
        }

        return newErrors;
    }, [email, password, t]);

    const handleFormSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            const validationErrors = validate();

            setErrors(validationErrors);

            if (Object.keys(validationErrors).length > 0) {
                showErrorToast(t('validation.fixErrors'), {
                    toastId: 'login-validation',
                });

                return;
            }

            setIsLoading(true);

            try {
                await login({ email: email.trim(), password });

                if (redirectPath) {
                    localStorage.removeItem('redirectAfterLogin');
                    navigate(redirectPath);
                    showSuccessToast(t('login.successRedirect'), {
                        toastId: 'auth-success-redirect',
                    });
                } else {
                    navigate('/Manga-Reader');
                    showSuccessToast(t('login.success'), {
                        toastId: 'auth-success',
                    });
                }
            } finally {
                setIsLoading(false);
            }
        },
        [login, navigate, redirectPath, email, password, validate, t],
    );

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <AuthenticationForm
                    onFormSubmit={handleFormSubmit}
                    title={t('login.title')}
                    helperText={t('login.helperText')}
                    link="/forgot-password"
                    linkText={t('login.linkText')}
                >
                    <BaseInput
                        label={t('login.emailLabel')}
                        type="email"
                        placeholder={t('login.emailPlaceholder')}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={isLoading}
                        error={errors.email}
                        name="email"
                    />
                    <BaseInput
                        label={t('login.passwordLabel')}
                        type="password"
                        placeholder={t('login.passwordPlaceholder')}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={isLoading}
                        error={errors.password}
                        name="password"
                    />
                    <RaisedButton
                        text={
                            isLoading
                                ? t('login.submitLoading')
                                : t('login.submit')
                        }
                    />
                </AuthenticationForm>
            </MainContent>
            <Footer showLinks={true} />
        </>
    );
};

export default Login;
