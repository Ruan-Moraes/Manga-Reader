import { useState, useCallback } from 'react';

import { requestPasswordReset } from '@feature/auth/service/authService';

import {
    showSuccessToast,
    showErrorToast,
} from '@shared/service/util/toastService';

const useForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleEmailChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(e.target.value);
        },
        [],
    );

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const trimmedEmail = email.trim();

            if (!trimmedEmail) {
                showErrorToast('Por favor, insira seu email.');
                return;
            }

            setIsLoading(true);

            try {
                const response = await requestPasswordReset(trimmedEmail);

                if (response.success) {
                    setIsSubmitted(true);
                    showSuccessToast(
                        response.message ?? 'Email enviado com sucesso!',
                    );
                } else {
                    showErrorToast(response.message ?? 'Erro ao enviar email.');
                }
            } catch {
                showErrorToast('Ocorreu um erro inesperado. Tente novamente.');
            } finally {
                setIsLoading(false);
            }
        },
        [email],
    );

    return {
        email,
        isLoading,
        isSubmitted,
        handleEmailChange,
        handleSubmit,
    };
};

export default useForgotPassword;
