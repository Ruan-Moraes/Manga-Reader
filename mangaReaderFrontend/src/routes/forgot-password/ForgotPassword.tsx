import { useCallback } from 'react';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import AuthenticationForm from '../../components/forms/AuthenticationForm';
import BaseInput from '../../components/inputs/BaseInput';
import RaisedButton from '../../components/buttons/RaisedButton';

const ForgotPassword = () => {
    const handleFormSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            console.log('Form submitted');
        },
        [],
    );

    return (
        <>
            <Header disabledSearch={true} />
            <Main>
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
            </Main>
            <Footer disabledLinks={true} />
        </>
    );
};

export default ForgotPassword;
