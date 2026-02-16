import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
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

// TODO: Implementar autenticação real
const Login = () => {
    const navigate = useNavigate();

    const [redirectPath, setRedirectPath] = useState<string | null>(null);
    const { login } = useAuth();

    useEffect(() => {
        const storedPath = localStorage.getItem('redirectAfterLogin');

        if (storedPath) {
            setRedirectPath(storedPath);

            showInfoToast(
                'Após o login, você será redirecionado para a página que tentou acessar.',
                { toastId: 'redirect-info' },
            );
        }
    }, []);

    const handleFormSubmit = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            login();

            if (redirectPath) {
                localStorage.removeItem('redirectAfterLogin');

                navigate(redirectPath);

                showSuccessToast(
                    'Autenticação bem-sucedida! Redirecionando para a página solicitada.',
                    { toastId: 'auth-success-redirect' },
                );
            }

            if (!redirectPath) {
                navigate('/Manga-Reader');

                showSuccessToast('Autenticação bem-sucedida!', {
                    toastId: 'auth-success',
                });
            }
        },
        [login, navigate, redirectPath],
    );

    return (
        <>
            <Header disabledSearch={true} />
            <MainContent>
                <AuthenticationForm
                    onFormSubmit={handleFormSubmit}
                    title="Login de usuário"
                    helperText="Esqueceu sua senha?"
                    link="/forgot-password"
                    linkText="Clique aqui"
                >
                    <BaseInput
                        label="Email"
                        type="email"
                        placeholder="Digite seu email"
                    />
                    <BaseInput
                        label="Senha:"
                        type="password"
                        placeholder="Digite sua senha"
                    />
                    <RaisedButton text="Entrar:" />
                </AuthenticationForm>
            </MainContent>
            <Footer disabledLinks={true} />
        </>
    );
};

export default Login;
