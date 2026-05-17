import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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

import { WEB_BASE_URL } from '@shared/constant/baseUrl';

import { useAuth, buildLoginSchema, type LoginFormValues } from '@feature/auth';

const Login = () => {
    const { t } = useTranslation('auth');
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [redirectPath, setRedirectPath] = useState<string | null>(null);

    const { login } = useAuth();

    const schema = useMemo(() => buildLoginSchema(t), [t]);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '' },
        mode: 'onTouched',
    });

    useEffect(() => {
        const storedPath = localStorage.getItem('redirectAfterLogin');

        if (storedPath) {
            setRedirectPath(storedPath);

            showInfoToast(t('login.redirectInfo'), {
                toastId: 'redirect-info',
            });
        }
    }, [t]);

    const onSubmit = useCallback(
        async (values: LoginFormValues) => {
            setIsLoading(true);

            try {
                await login({
                    email: values.email.trim(),
                    password: values.password,
                });

                if (redirectPath) {
                    localStorage.removeItem('redirectAfterLogin');
                    navigate(redirectPath);
                    showSuccessToast(t('login.successRedirect'), {
                        toastId: 'auth-success-redirect',
                    });
                } else {
                    navigate(WEB_BASE_URL);
                    showSuccessToast(t('login.success'), {
                        toastId: 'auth-success',
                    });
                }
            } finally {
                setIsLoading(false);
            }
        },
        [login, navigate, redirectPath, t],
    );

    const onInvalid = useCallback(() => {
        showErrorToast(t('validation.fixErrors'), {
            toastId: 'login-validation',
        });
    }, [t]);

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <AuthenticationForm
                    onFormSubmit={handleSubmit(onSubmit, onInvalid)}
                    title={t('login.title')}
                    helperText={t('login.helperText')}
                    link="/forgot-password"
                    linkText={t('login.linkText')}
                >
                    <Controller
                        control={control}
                        name="email"
                        render={({ field }) => (
                            <BaseInput
                                label={t('login.emailLabel')}
                                type="email"
                                placeholder={t('login.emailPlaceholder')}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isLoading}
                                error={errors.email?.message}
                                name="email"
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="password"
                        render={({ field }) => (
                            <BaseInput
                                label={t('login.passwordLabel')}
                                type="password"
                                placeholder={t('login.passwordPlaceholder')}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isLoading}
                                error={errors.password?.message}
                                name="password"
                            />
                        )}
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
