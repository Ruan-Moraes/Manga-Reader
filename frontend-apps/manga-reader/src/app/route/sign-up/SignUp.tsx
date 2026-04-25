import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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

import { useAuth } from '@feature/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
};

const SignUp = () => {
    const { t } = useTranslation('auth');
    const navigate = useNavigate();
    const { register } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptDmca, setAcceptDmca] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const validate = useCallback((): FormErrors => {
        const newErrors: FormErrors = {};

        if (!name.trim()) {
            newErrors.name = t('validation.nameRequired');
        }

        if (name.trim().length < 2) {
            newErrors.name = t('validation.nameMin');
        }

        if (!email.trim()) {
            newErrors.email = t('validation.emailRequired');
        }

        if (!EMAIL_REGEX.test(email.trim())) {
            newErrors.email = t('validation.emailInvalid');
        }

        if (!password) {
            newErrors.password = t('validation.passwordRequired');
        }

        if (password.length < 6) {
            newErrors.password = t('validation.passwordMin');
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = t(
                'validation.confirmPasswordRequired',
            );
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = t('validation.passwordsDoNotMatch');
        }

        if (!acceptTerms || !acceptDmca) {
            newErrors.terms = t('validation.acceptTermsAndDmca');
        }

        return newErrors;
    }, [name, email, password, confirmPassword, acceptTerms, acceptDmca, t]);

    const handleFormSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const validationErrors = validate();

            setErrors(validationErrors);

            if (Object.keys(validationErrors).length > 0) {
                showErrorToast(t('validation.fixErrors'), {
                    toastId: 'signup-validation',
                });

                return;
            }

            setIsLoading(true);

            try {
                await register({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                });

                showSuccessToast(t('signUp.success'), {
                    toastId: 'signup-success',
                });

                navigate('/Manga-Reader');
            } finally {
                setIsLoading(false);
            }
        },
        [register, navigate, name, email, password, validate, t],
    );

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <AuthenticationForm
                    onFormSubmit={handleFormSubmit}
                    title={t('signUp.title')}
                >
                    <BaseInput
                        label={t('signUp.nameLabel')}
                        type="text"
                        placeholder={t('signUp.namePlaceholder')}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={isLoading}
                        error={errors.name}
                        name="name"
                    />
                    <BaseInput
                        label={t('signUp.emailLabel')}
                        type="email"
                        placeholder={t('signUp.emailPlaceholder')}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={isLoading}
                        error={errors.email}
                        name="email"
                    />
                    <BaseInput
                        label={t('signUp.passwordLabel')}
                        type="password"
                        placeholder={t('signUp.passwordPlaceholder')}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={isLoading}
                        error={errors.password}
                        name="password"
                    />
                    <BaseInput
                        label={t('signUp.confirmPasswordLabel')}
                        type="password"
                        placeholder={t('signUp.confirmPasswordPlaceholder')}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        error={errors.confirmPassword}
                        name="confirmPassword"
                    />
                    <div className="flex flex-col gap-2">
                        <Checkbox
                            label={t('signUp.acceptTerms')}
                            link="/terms-of-use"
                            linkText={t('signUp.termsLink')}
                            checked={acceptTerms}
                            onChange={setAcceptTerms}
                        />
                        <Checkbox
                            label={t('signUp.acceptDmca')}
                            link="/dmca"
                            linkText={t('signUp.dmcaLink')}
                            checked={acceptDmca}
                            onChange={setAcceptDmca}
                        />
                        {errors.terms && (
                            <span className="text-xs text-red-500">
                                {errors.terms}
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
