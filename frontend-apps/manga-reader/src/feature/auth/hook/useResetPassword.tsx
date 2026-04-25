import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
    showSuccessToast,
    showErrorToast,
} from '@shared/service/util/toastService';

import { resetPassword } from '@feature/auth/service/authService';

type FormErrors = {
    password?: string;
    confirmPassword?: string;
};

const useResetPassword = () => {
    const { t } = useTranslation('auth');
    const [searchParams] = useSearchParams();

    const navigate = useNavigate();

    const token = searchParams.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const handlePasswordChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setPassword(e.target.value);
        },
        [],
    );

    const handleConfirmPasswordChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setConfirmPassword(e.target.value);
        },
        [],
    );

    const validate = useCallback((): FormErrors => {
        const newErrors: FormErrors = {};

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

        return newErrors;
    }, [password, confirmPassword, t]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const validationErrors = validate();

            setErrors(validationErrors);

            if (Object.keys(validationErrors).length > 0) {
                showErrorToast(t('validation.fixErrors'), {
                    toastId: 'reset-password-validation',
                });

                return;
            }

            setIsLoading(true);

            try {
                const message = await resetPassword(token, password);

                showSuccessToast(message ?? t('resetPassword.success'));

                navigate('/Manga-Reader/login');
            } catch {
                showErrorToast(t('validation.unexpectedError'));
            } finally {
                setIsLoading(false);
            }
        },
        [password, token, navigate, validate, t],
    );

    return {
        token,
        password,
        confirmPassword,
        isLoading,
        errors,
        handlePasswordChange,
        handleConfirmPasswordChange,
        handleSubmit,
    };
};

export default useResetPassword;
