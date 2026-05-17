import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AuthenticationForm from '@shared/component/form/AuthenticationForm';
import BaseInput from '@shared/component/input/BaseInput';
import ButtonHighLight from '@shared/component/button/RaisedButton';
import Checkbox from '@shared/component/input/CheckboxWithLink';

import { WEB_BASE_URL } from '@shared/constant/baseUrl';

import {
    useAuth,
    buildSignUpSchema,
    type SignUpFormValues,
} from '@feature/auth';

const SignUp = () => {
    const { t } = useTranslation('auth');
    const navigate = useNavigate();
    const { register } = useAuth();

    const [isLoading, setIsLoading] = useState(false);

    const schema = useMemo(() => buildSignUpSchema(t), [t]);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<SignUpFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            acceptTerms: false,
            acceptDmca: false,
        },
        mode: 'onTouched',
    });

    const onSubmit = useCallback(
        async (values: SignUpFormValues) => {
            setIsLoading(true);

            try {
                await register({
                    name: values.name.trim(),
                    email: values.email.trim(),
                    password: values.password,
                });

                showSuccessToast(t('signUp.success'), {
                    toastId: 'signup-success',
                });

                navigate(WEB_BASE_URL);
            } finally {
                setIsLoading(false);
            }
        },
        [register, navigate, t],
    );

    const onInvalid = useCallback(() => {
        showErrorToast(t('validation.fixErrors'), {
            toastId: 'signup-validation',
        });
    }, [t]);

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <AuthenticationForm
                    onFormSubmit={handleSubmit(onSubmit, onInvalid)}
                    title={t('signUp.title')}
                >
                    <Controller
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <BaseInput
                                label={t('signUp.nameLabel')}
                                type="text"
                                placeholder={t('signUp.namePlaceholder')}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isLoading}
                                error={errors.name?.message}
                                name="name"
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="email"
                        render={({ field }) => (
                            <BaseInput
                                label={t('signUp.emailLabel')}
                                type="email"
                                placeholder={t('signUp.emailPlaceholder')}
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
                                label={t('signUp.passwordLabel')}
                                type="password"
                                placeholder={t('signUp.passwordPlaceholder')}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isLoading}
                                error={errors.password?.message}
                                name="password"
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <BaseInput
                                label={t('signUp.confirmPasswordLabel')}
                                type="password"
                                placeholder={t(
                                    'signUp.confirmPasswordPlaceholder',
                                )}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isLoading}
                                error={errors.confirmPassword?.message}
                                name="confirmPassword"
                            />
                        )}
                    />
                    <div className="flex flex-col gap-2">
                        <Controller
                            control={control}
                            name="acceptTerms"
                            render={({ field }) => (
                                <Checkbox
                                    label={t('signUp.acceptTerms')}
                                    link="/terms-of-use"
                                    linkText={t('signUp.termsLink')}
                                    checked={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="acceptDmca"
                            render={({ field }) => (
                                <Checkbox
                                    label={t('signUp.acceptDmca')}
                                    link="/dmca"
                                    linkText={t('signUp.dmcaLink')}
                                    checked={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        {errors.acceptTerms && (
                            <span className="text-xs text-red-500">
                                {errors.acceptTerms.message}
                            </span>
                        )}
                    </div>
                    <ButtonHighLight
                        text={
                            isLoading
                                ? t('signUp.submitLoading')
                                : t('signUp.submit')
                        }
                    />
                </AuthenticationForm>
            </MainContent>
            <Footer showLinks={true} />
        </>
    );
};

export default SignUp;
