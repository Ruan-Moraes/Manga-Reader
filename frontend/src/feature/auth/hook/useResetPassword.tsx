import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import {
    showSuccessToast,
    showErrorToast,
} from '@shared/service/util/toastService';

import { resetPassword } from '@feature/auth/service/authService';

const useResetPassword = () => {
    const [searchParams] = useSearchParams();

    const navigate = useNavigate();

    const token = searchParams.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);

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

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            if (!password || !confirmPassword) {
                showErrorToast('Preencha todos os campos.');

                return;
            }

            if (password.length < 6) {
                showErrorToast('A senha deve ter pelo menos 6 caracteres.');

                return;
            }

            if (password !== confirmPassword) {
                showErrorToast('As senhas não coincidem.');

                return;
            }

            setIsLoading(true);

            try {
                const response = await resetPassword(token, password);

                if (response.success) {
                    showSuccessToast(
                        response.message ?? 'Senha redefinida com sucesso!',
                    );
                    navigate('/Manga-Reader/login');
                } else {
                    showErrorToast(
                        response.message ?? 'Erro ao redefinir senha.',
                    );
                }
            } catch {
                showErrorToast('Ocorreu um erro inesperado. Tente novamente.');
            } finally {
                setIsLoading(false);
            }
        },
        [password, confirmPassword, token, navigate],
    );

    return {
        token,
        password,
        confirmPassword,
        isLoading,
        handlePasswordChange,
        handleConfirmPasswordChange,
        handleSubmit,
    };
};

export default useResetPassword;
