import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const SignUp = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptDmca, setAcceptDmca] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFormSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            if (password.length < 6) {
                showErrorToast('A senha deve ter pelo menos 6 caracteres.', {
                    toastId: 'signup-password-length',
                });
                return;
            }

            if (password !== confirmPassword) {
                showErrorToast('As senhas não coincidem.', {
                    toastId: 'signup-password-mismatch',
                });
                return;
            }

            if (!acceptTerms || !acceptDmca) {
                showErrorToast(
                    'Você deve aceitar os Termos de Uso e a política DMCA.',
                    { toastId: 'signup-terms' },
                );
                return;
            }

            setIsLoading(true);

            try {
                await register({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                });

                showSuccessToast('Conta criada com sucesso!', {
                    toastId: 'signup-success',
                });

                navigate('/Manga-Reader');
            } finally {
                setIsLoading(false);
            }
        },
        [
            register,
            navigate,
            name,
            email,
            password,
            confirmPassword,
            acceptTerms,
            acceptDmca,
        ],
    );

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <AuthenticationForm
                    onFormSubmit={handleFormSubmit}
                    title="Cadastro de usuário"
                >
                    <BaseInput
                        label="Nome:"
                        type="text"
                        placeholder="Nome de usuário"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={isLoading}
                    />
                    <BaseInput
                        label="Email:"
                        type="email"
                        placeholder="Digite seu email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                    <BaseInput
                        label="Senha:"
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    <BaseInput
                        label="Confirmar senha:"
                        type="password"
                        placeholder="Confirme sua senha"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    <div className="flex flex-col gap-2">
                        <Checkbox
                            label="Eu aceito os"
                            link="/terms-of-use"
                            linkText="Termos de uso."
                            checked={acceptTerms}
                            onChange={setAcceptTerms}
                        />
                        <Checkbox
                            label="Eu aceito as políticas de "
                            link="/dmca"
                            linkText="DMCA."
                            checked={acceptDmca}
                            onChange={setAcceptDmca}
                        />
                    </div>
                    <ButtonHighLight
                        text={isLoading ? 'Cadastrando...' : 'Cadastrar'}
                    />
                </AuthenticationForm>
            </MainContent>
            <Footer showLinks={true} />
        </>
    );
};

export default SignUp;
