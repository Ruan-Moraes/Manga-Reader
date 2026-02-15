import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    showInfoToast,
    showSuccessToast,
} from '../../services/utils/toastUtils';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import AuthenticationForm from '../../components/forms/AuthenticationForm';
import BaseInput from '../../components/inputs/BaseInput';
import RaisedButton from '../../components/buttons/RaisedButton';
import useAuth from '../../hooks/user/useAuth';

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
            <Main>
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
            </Main>
            <Footer disabledLinks={true} />
        </>
    );
};

export default Login;
