import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AuthenticationForm from '@shared/component/form/AuthenticationForm';
import BaseInput from '@shared/component/input/BaseInput';
import ButtonHighLight from '@shared/component/button/RaisedButton';
import Checkbox from '@shared/component/input/CheckboxWithLink';

const SignUp = () => {
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        console.log('Form submitted');
    };

    return (
        <>
            <Header disabledSearch={true} />
            <MainContent>
                <AuthenticationForm
                    onFormSubmit={handleFormSubmit}
                    title="Cadastro de usuário"
                >
                    <BaseInput
                        label="Nome:"
                        type="text"
                        placeholder="Nome de usuário"
                    />
                    <BaseInput
                        label="Email:"
                        type="email"
                        placeholder="Digite seu email"
                    />
                    <BaseInput
                        label="Senha:"
                        type="password"
                        placeholder="Digite sua senha"
                    />
                    <BaseInput
                        label="Confirmar senha:"
                        type="password"
                        placeholder="Confirme sua senha"
                    />
                    <div className="flex flex-col gap-2">
                        <Checkbox
                            label="Eu aceito os"
                            link="/terms-of-use"
                            linkText="Termos de uso."
                        />
                        <Checkbox
                            label="Eu aceito as políticas de "
                            link="/dmca"
                            linkText="DMCA."
                        />
                    </div>
                    <ButtonHighLight text="Cadastrar" />
                </AuthenticationForm>
            </MainContent>
            <Footer disabledLinks={true} />
        </>
    );
};

export default SignUp;
