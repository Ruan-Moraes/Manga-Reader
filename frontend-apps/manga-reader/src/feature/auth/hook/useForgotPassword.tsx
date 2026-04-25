import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { requestPasswordReset } from '@feature/auth/service/authService';

import {
    showSuccessToast,
    showErrorToast,
} from '@shared/service/util/toastService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
    email?: string;
};

const useForgotPassword = () => {
    const { t } = useTranslation('auth');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const handleEmailChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(e.target.value);
        },
        [],
    );

    const validate = useCallback((): FormErrors => {
        const newErrors: FormErrors = {};
        const trimmed = email.trim();

        if (!trimmed) {
            newErrors.email = t('validation.emailRequired');
        }

        if (!EMAIL_REGEX.test(trimmed)) {
            newErrors.email = t('validation.emailInvalid');
        }

        return newErrors;
    }, [email, t]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const validationErrors = validate();

            setErrors(validationErrors);

            if (Object.keys(validationErrors).length > 0) {
                showErrorToast(t('validation.fixErrors'), {
                    toastId: 'forgot-password-validation',
                });

                return;
            }

            setIsLoading(true);

            try {
                const message = await requestPasswordReset(email.trim());

                setIsSubmitted(true);

                showSuccessToast(message ?? t('forgotPassword.success'));
            } catch {
                showErrorToast(t('validation.unexpectedError'));
            } finally {
                setIsLoading(false);
            }
        },
        [email, validate, t],
    );

    return {
        email,
        isLoading,
        isSubmitted,
        errors,
        handleEmailChange,
        handleSubmit,
    };
};

export default useForgotPassword;
