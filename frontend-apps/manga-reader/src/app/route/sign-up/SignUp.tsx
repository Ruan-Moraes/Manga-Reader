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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
};

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
    const [errors, setErrors] = useState<FormErrors>({});

    const validate = useCallback((): FormErrors => {
        const newErrors: FormErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Nome é obrigatório.';
        }

        if (name.trim().length < 2) {
            newErrors.name = 'Nome deve ter pelo menos 2 caracteres.';
        }

        if (!email.trim()) {
            newErrors.email = 'Email é obrigatório.';
        }

        if (!EMAIL_REGEX.test(email.trim())) {
            newErrors.email = 'Formato de email inválido.';
        }

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

        if (!acceptTerms || !acceptDmca) {
            newErrors.terms =
                'Você deve aceitar os Termos de Uso e a política DMCA.';
        }

        return newErrors;
    }, [name, email, password, confirmPassword, acceptTerms, acceptDmca]);

    const handleFormSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const validationErrors = validate();

            setErrors(validationErrors);

            if (Object.keys(validationErrors).length > 0) {
                showErrorToast('Corrija os erros no formulário.', {
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

                showSuccessToast('Conta criada com sucesso!', {
                    toastId: 'signup-success',
                });

                navigate('/Manga-Reader');
            } finally {
                setIsLoading(false);
            }
        },
        [register, navigate, name, email, password, validate],
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
                        error={errors.name}
                        name="name"
                    />
                    <BaseInput
                        label="Email:"
                        type="email"
                        placeholder="Digite seu email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={isLoading}
                        error={errors.email}
                        name="email"
                    />
                    <BaseInput
                        label="Senha:"
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={isLoading}
                        error={errors.password}
                        name="password"
                    />
                    <BaseInput
                        label="Confirmar senha:"
                        type="password"
                        placeholder="Confirme sua senha"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        error={errors.confirmPassword}
                        name="confirmPassword"
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
                        {errors.terms && (
                            <span className="text-xs text-red-500">
                                {errors.terms}
                            </span>
                        )}
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
