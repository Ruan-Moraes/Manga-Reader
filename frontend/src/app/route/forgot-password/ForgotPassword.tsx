import { useCallback } from 'react';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AuthenticationForm from '@shared/component/form/AuthenticationForm';
import BaseInput from '@shared/component/input/BaseInput';
import RaisedButton from '@shared/component/button/RaisedButton';

const ForgotPassword = () => {
    // TODO: Criar a feature de recuperação de senha, permitindo que os usuários possam solicitar a recuperação de senha através do email cadastrado. Implementar a lógica para enviar um email com um link de recuperação para o usuário, e criar uma página para o usuário poder criar uma nova senha após clicar no link recebido por email.
    const handleFormSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            console.log('Form submitted');
        },
        [],
    );

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <AuthenticationForm
                    onFormSubmit={handleFormSubmit}
                    title="Recuperação de senha"
                    helperText="Lembrou da senha?"
                    link="/login"
                    linkText="Clique aqui"
                >
                    <BaseInput
                        label="Email"
                        type="email"
                        placeholder="Digite seu email"
                    />
                    <RaisedButton text="Recuperar senha" />
                </AuthenticationForm>
            </MainContent>
            <Footer showLinks={true} />
        </>
    );
};

export default ForgotPassword;
