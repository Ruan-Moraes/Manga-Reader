import { useCallback } from 'react';

import Header from '@app/layout/Header';
import Main from '@app/layout/Main';
import Footer from '@app/layout/Footer';

import AuthenticationForm from '@shared/component/form/AuthenticationForm';
import BaseInput from '@shared/component/input/BaseInput';
import RaisedButton from '@shared/component/button/RaisedButton';

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
