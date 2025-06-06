import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import AuthenticationForm from '../../components/forms/AuthenticationForm';
import BaseInput from '../../components/inputs/BaseInput';
import ButtonHighLight from '../../components/buttons/RaisedButton';
import Checkbox from '../../components/inputs/CheckboxInput';

const SignUp = () => {
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        console.log('Form submitted');
    };

    return (
        <>
            <Header disabledSearch={true} />
            <Main>
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
            </Main>
            <Footer disabledLinks={true} />
        </>
    );
};

export default SignUp;
