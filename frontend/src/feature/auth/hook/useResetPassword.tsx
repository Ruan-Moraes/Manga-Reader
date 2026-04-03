import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

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
            newErrors.password = 'Senha é obrigatória.';
        }

        if (password.length < 6) {
            newErrors.password = 'A senha deve ter pelo menos 6 caracteres.';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Confirmação de senha é obrigatória.';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'As senhas não coincidem.';
        }

        return newErrors;
    }, [password, confirmPassword]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const validationErrors = validate();

            setErrors(validationErrors);

            if (Object.keys(validationErrors).length > 0) {
                showErrorToast('Corrija os erros no formulário.', {
                    toastId: 'reset-password-validation',
                });

                return;
            }

            setIsLoading(true);

            try {
                const message = await resetPassword(token, password);

                showSuccessToast(message ?? 'Senha redefinida com sucesso!');

                navigate('/Manga-Reader/login');
            } catch {
                showErrorToast('Ocorreu um erro inesperado. Tente novamente.');
            } finally {
                setIsLoading(false);
            }
        },
        [password, token, navigate, validate],
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
