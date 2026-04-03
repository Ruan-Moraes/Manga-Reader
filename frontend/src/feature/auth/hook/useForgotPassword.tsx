import { useState, useCallback } from 'react';

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
            newErrors.email = 'Email é obrigatório.';
        }

        if (!EMAIL_REGEX.test(trimmed)) {
            newErrors.email = 'Formato de email inválido.';
        }

        return newErrors;
    }, [email]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const validationErrors = validate();

            setErrors(validationErrors);

            if (Object.keys(validationErrors).length > 0) {
                showErrorToast('Corrija os erros no formulário.', {
                    toastId: 'forgot-password-validation',
                });

                return;
            }

            setIsLoading(true);

            try {
                const message = await requestPasswordReset(email.trim());

                setIsSubmitted(true);

                showSuccessToast(message ?? 'Email enviado com sucesso!');
            } catch {
                showErrorToast('Ocorreu um erro inesperado. Tente novamente.');
            } finally {
                setIsLoading(false);
            }
        },
        [email, validate],
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
